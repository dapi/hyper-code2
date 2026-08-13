import { detectSentinel } from "../r018-sentinel-lib";
import type { Candidate, DiscoveryStages, DurableSpy, Layer, RefreshReceipt, RefreshStages, SyntheticRequest, TransportReceipt } from "./contracts";
import { CODEX_ACCESS_TOKEN, MODEL_IDS, SENTINEL, SENTINEL_FORMS, sha256 } from "./fixtures";

const sealed = Object.freeze({ apiKey: SENTINEL, kimi: `${SENTINEL}:kimi-schema`, anthropic: `${SENTINEL}:anthropic-schema`, codex: CODEX_ACCESS_TOKEN, discovery: `${SENTINEL}:discovery-schema` });
const allowed = new Set(["status", "provider", "model", "models", "code"]);
function schemaProjection(layer: Layer, value: unknown) { if (!value || typeof value !== "object") return { layer, value: "[SCHEMA-OMITTED]" }; const result: Record<string, unknown> = { layer }; for (const [key, item] of Object.entries(value)) if (allowed.has(key)) result[key] = item; return result; }
function schemaTransport(request: SyntheticRequest, secret: string): TransportReceipt { const authScheme = request.authMode; return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${secret}` : secret), dispatchCalls: 1, rawRetained: false }; }
function schemaClaim(token: string) { const parts = token.split("."); if (parts.length !== 3) throw new Error("SCHEMA_REJECTED"); const parsed = JSON.parse(Buffer.from(parts[1]!, "base64url").toString()); if (typeof parsed.sub !== "string" || typeof parsed.iss !== "string") throw new Error("SCHEMA_REJECTED"); return parsed.sub as string; }

export const candidate03: Candidate = {
  id: "CAND-03", mechanism: "sealed-credential-config-with-owned-output-schemas",
  inference(request) { return schemaTransport(request, sealed.apiKey); },
  refresh(request, stages: RefreshStages): RefreshReceipt { const store = request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file";
    const token = stages.read(() => sealed[request.provider as "kimi"|"anthropic"|"codex"]);
    const oauth = stages.oauthRequest(() => schemaTransport(request, token));
    const response = stages.oauthResponse(() => `${token}:schema-response`);
    const writeDigest = stages.write(() => sha256(`${response}:write`));
    return { provider: request.provider as any, store, stageCalls: { read: 1, oauthRequest: 1, oauthResponse: 1, write: 1 }, oauth, oauthResponseDigest: sha256(response), writeDigest, rawRetained: false }; },
  accountIdentity() { return { accountIdDigest: sha256(schemaClaim(sealed.codex)), source: "synthetic-access-token-claim", rawRetained: false }; },
  discovery(request, stages: DiscoveryStages) { const projected = MODEL_IDS.map(id => String(id)); const transport = stages.transport(() => schemaTransport(request, sealed.discovery)); const rendered = stages.render(() => JSON.stringify({ models: projected })); return { transportCalls: 1, renderCalls: 1, transport, modelIds: projected, rendered, rawRetained: false }; },
  project: schemaProjection,
  secretFixture(value) { return { apiKey: value, status: "candidate" }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) { let serialized: string; try { const raw = JSON.stringify(value); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("SERIALIZATION_REJECTED"); serialized = JSON.stringify(schemaProjection("persistence", value)); } catch { throw new Error("SERIALIZATION_REJECTED"); } durable.write(serialized); return serialized; },
  failureScenario(code) { return { code, dispatchCalls: 0, ambientFallbackCalls: 0 }; },
  retryScenario(cancelled) { return cancelled ? { resolutionCalls: 1, dispatchCalls: 0, rawRetryState: false, code: "OPERATION_CANCELLED" } : { resolutionCalls: 2, dispatchCalls: 2, rawRetryState: false }; },
  restartScenario(revoked) { return revoked ? { recoveredRawCredential: false, revalidationCalls: 1, code: "CREDENTIAL_REVOKED" } : { recoveredRawCredential: false, revalidationCalls: 1 }; },
  authority: {
    "ctx-env": () => ({ path: "ctx-env", schema: "GeneratedAuthorityProjection", allowed: false }),
    "settings-get": () => ({ path: "settings-get", schema: "GeneratedAuthorityProjection", allowed: false }),
    "settings-getString": () => ({ path: "settings-getString", schema: "GeneratedAuthorityProjection", allowed: false }),
    "settings-list": () => ({ path: "settings-list", schema: "GeneratedAuthorityProjection", allowed: false }),
    "db-select": () => ({ path: "db-select", schema: "GeneratedAuthorityProjection", allowed: false }),
    "file-read": () => ({ path: "file-read", schema: "GeneratedAuthorityProjection", allowed: false }),
    "keychain-command": () => ({ path: "keychain-command", schema: "GeneratedAuthorityProjection", allowed: false }),
  },
};
