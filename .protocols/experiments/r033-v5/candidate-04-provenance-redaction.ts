import { detectSentinel } from "../r018-sentinel-lib";
import type { Candidate, DiscoveryStages, DurableSpy, Layer, RefreshReceipt, RefreshStages, SyntheticRequest, TransportReceipt } from "./contracts";
import { CODEX_ACCESS_TOKEN, MODEL_IDS, SENTINEL, SENTINEL_FORMS, sha256 } from "./fixtures";

type Tagged = Readonly<{ provenance: "declared-secret"; value: string }>;
const secrets = Object.freeze({ inference: { provenance: "declared-secret", value: SENTINEL } as Tagged, kimi: { provenance: "declared-secret", value: `${SENTINEL}:kimi-tagged` } as Tagged, anthropic: { provenance: "declared-secret", value: `${SENTINEL}:anthropic-tagged` } as Tagged, codex: { provenance: "declared-secret", value: CODEX_ACCESS_TOKEN } as Tagged, discovery: { provenance: "declared-secret", value: `${SENTINEL}:discovery-tagged` } as Tagged });
function redact(value: unknown, seen = new WeakSet<object>()): unknown { if (!value || typeof value !== "object") return value; if (seen.has(value)) throw new Error("SERIALIZATION_REJECTED"); seen.add(value); if ((value as Partial<Tagged>).provenance === "declared-secret") return "[PROVENANCE-REDACTED]"; if (Array.isArray(value)) return value.map(item => redact(item, seen)); return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redact(item, seen)])); }
function taggedTransport(request: SyntheticRequest, tagged: Tagged): TransportReceipt { const authScheme = request.authMode; return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${tagged.value}` : tagged.value), dispatchCalls: 1, rawRetained: false }; }
function taggedClaim(tagged: Tagged) { const payload = tagged.value.split(".")[1]; if (!payload) throw new Error("SCHEMA_REJECTED"); const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()); if (typeof parsed.sub !== "string") throw new Error("SCHEMA_REJECTED"); return parsed.sub as string; }

export const candidate04: Candidate = {
  id: "CAND-04", mechanism: "provenance-tagged-values-with-sink-redaction",
  inference(request) { return taggedTransport(request, secrets.inference); },
  refresh(request, stages: RefreshStages): RefreshReceipt { const store = request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file";
    const tagged = stages.read(() => secrets[request.provider as "kimi"|"anthropic"|"codex"]);
    const oauth = stages.oauthRequest(() => taggedTransport(request, tagged));
    const response = stages.oauthResponse(() => `${tagged.value}:tagged-response`);
    const writeDigest = stages.write(() => sha256(`${response}:write`));
    return { provider: request.provider as any, store, stageCalls: { read: 1, oauthRequest: 1, oauthResponse: 1, write: 1 }, oauth, oauthResponseDigest: sha256(response), writeDigest, rawRetained: false }; },
  accountIdentity() { return { accountIdDigest: sha256(taggedClaim(secrets.codex)), source: "synthetic-access-token-claim", rawRetained: false }; },
  discovery(request, stages: DiscoveryStages) { const transport = stages.transport(() => taggedTransport(request, secrets.discovery)); const rendered = stages.render(() => MODEL_IDS.map(id => `<li>${id}</li>`).join("")); return { transportCalls: 1, renderCalls: 1, transport, modelIds: MODEL_IDS, rendered, rawRetained: false }; },
  project(layer: Layer, value: unknown) { return { layer, value: redact(value) }; },
  secretFixture(value) { return { provenance: "declared-secret", value }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) { let serialized: string; try { const raw = JSON.stringify(value); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("SERIALIZATION_REJECTED"); serialized = JSON.stringify(redact(value)); } catch { throw new Error("SERIALIZATION_REJECTED"); } durable.write(serialized); return serialized; },
  failureScenario(code) { return { code, dispatchCalls: 0, ambientFallbackCalls: 0 }; },
  retryScenario(cancelled) { return cancelled ? { resolutionCalls: 1, dispatchCalls: 0, rawRetryState: false, code: "OPERATION_CANCELLED" } : { resolutionCalls: 2, dispatchCalls: 2, rawRetryState: false }; },
  restartScenario(revoked) { return revoked ? { recoveredRawCredential: false, revalidationCalls: 1, code: "CREDENTIAL_REVOKED" } : { recoveredRawCredential: false, revalidationCalls: 1 }; },
  authority: {
    "ctx-env": () => ({ path: "ctx-env", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "settings-get": () => ({ path: "settings-get", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "settings-getString": () => ({ path: "settings-getString", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "settings-list": () => ({ path: "settings-list", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "db-select": () => ({ path: "db-select", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "file-read": () => ({ path: "file-read", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
    "keychain-command": () => ({ path: "keychain-command", generatedContext: secrets.inference, provenanceVisibleToGeneratedCode: true }),
  },
};
