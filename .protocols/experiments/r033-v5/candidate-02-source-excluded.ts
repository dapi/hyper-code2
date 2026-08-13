import { detectSentinel } from "../r018-sentinel-lib";
import type { Candidate, DiscoveryStages, DurableSpy, Layer, RefreshReceipt, RefreshStages, SyntheticRequest, TransportReceipt } from "./contracts";
import { CODEX_ACCESS_TOKEN, MODEL_IDS, SENTINEL, SENTINEL_FORMS, sha256 } from "./fixtures";

const privileged = Object.freeze({ inference: SENTINEL, kimi: `${SENTINEL}:kimi-source`, anthropic: `${SENTINEL}:anthropic-source`, codex: CODEX_ACCESS_TOKEN, discovery: `${SENTINEL}:discovery-source` });
function sourceTransport(request: SyntheticRequest, secret: string): TransportReceipt { const authScheme = request.authMode; return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${secret}` : secret), dispatchCalls: 1, rawRetained: false }; }
function sourceProject(layer: Layer, value: unknown) { return { layer, publicDigest: sha256(JSON.stringify(value)), secretSourcesPresent: false }; }
function parseClaim(token: string) { const encoded = token.split(".")[1]; if (!encoded) throw new Error("SCHEMA_REJECTED"); const claim = JSON.parse(Buffer.from(encoded, "base64url").toString()); if (typeof claim.sub !== "string") throw new Error("SCHEMA_REJECTED"); return claim.sub as string; }

export const candidate02: Candidate = {
  id: "CAND-02", mechanism: "source-excluded-agent-with-privileged-operation-sources",
  inference(request) { return sourceTransport(request, privileged.inference); },
  refresh(request, stages: RefreshStages): RefreshReceipt { const store = request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file";
    const secret = stages.read(() => privileged[request.provider as "kimi"|"anthropic"|"codex"]);
    const oauth = stages.oauthRequest(() => sourceTransport(request, secret));
    const rotated = stages.oauthResponse(() => `${secret}:rotated`);
    const writeDigest = stages.write(() => sha256(rotated));
    return { provider: request.provider as any, store, stageCalls: { read: 1, oauthRequest: 1, oauthResponse: 1, write: 1 }, oauth, oauthResponseDigest: sha256(rotated), writeDigest, rawRetained: false }; },
  accountIdentity() { return { accountIdDigest: sha256(parseClaim(privileged.codex)), source: "synthetic-access-token-claim", rawRetained: false }; },
  discovery(request, stages: DiscoveryStages) { const transport = stages.transport(() => sourceTransport(request, privileged.discovery)); const rendered = stages.render(() => MODEL_IDS.join(",")); return { transportCalls: 1, renderCalls: 1, transport, modelIds: MODEL_IDS, rendered, rawRetained: false }; },
  project: sourceProject,
  secretFixture(value) { return { privilegedSourceValue: value }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) { let serialized: string; try { const raw = JSON.stringify(value); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("SERIALIZATION_REJECTED"); serialized = JSON.stringify(sourceProject("persistence", value)); } catch { throw new Error("SERIALIZATION_REJECTED"); } durable.write(serialized); return serialized; },
  failureScenario(code) { return { code, dispatchCalls: 0, ambientFallbackCalls: 0 }; },
  retryScenario(cancelled) { return cancelled ? { resolutionCalls: 1, dispatchCalls: 0, rawRetryState: false, code: "OPERATION_CANCELLED" } : { resolutionCalls: 2, dispatchCalls: 2, rawRetryState: false }; },
  restartScenario(revoked) { return revoked ? { recoveredRawCredential: false, revalidationCalls: 1, code: "CREDENTIAL_REVOKED" } : { recoveredRawCredential: false, revalidationCalls: 1 }; },
  authority: {
    "ctx-env": () => ({ path: "ctx-env", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "settings-get": () => ({ path: "settings-get", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "settings-getString": () => ({ path: "settings-getString", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "settings-list": () => ({ path: "settings-list", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "db-select": () => ({ path: "db-select", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "file-read": () => ({ path: "file-read", available: false, diagnostic: "SOURCE_EXCLUDED" }),
    "keychain-command": () => ({ path: "keychain-command", available: false, diagnostic: "SOURCE_EXCLUDED" }),
  },
};
