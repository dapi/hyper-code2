import { detectSentinel } from "../r018-sentinel-lib";
import type { Candidate, DiscoveryStages, DurableSpy, Layer, RefreshReceipt, RefreshStages, SyntheticRequest, TransportReceipt } from "./contracts";
import { CODEX_ACCESS_TOKEN, MODEL_IDS, OPAQUE_REFERENCE, SENTINEL, SENTINEL_FORMS, sha256 } from "./fixtures";

const source = Object.freeze({ reference: OPAQUE_REFERENCE, inference: SENTINEL, kimi: `${SENTINEL}:kimi-composed`, anthropic: `${SENTINEL}:anthropic-composed`, codex: CODEX_ACCESS_TOKEN, discovery: `${SENTINEL}:discovery-composed` });
const projectionKeys = new Set(["status", "provider", "model", "models", "code", "credentialReference"]);
function boundResolve(reference: string, operation: "inference"|"kimi"|"anthropic"|"codex"|"discovery") { if (reference !== source.reference) throw new Error("CREDENTIAL_REFERENCE_INVALID"); return source[operation]; }
function composedProjection(layer: Layer, value: unknown) { const out: Record<string, unknown> = { layer }; if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) if (projectionKeys.has(key)) out[key] = typeof item === "string" && item.includes("R018-NONSECRET") ? "[COMPOSITION-REDACTED]" : item; return out; }
function composedTransport(request: SyntheticRequest, secret: string): TransportReceipt { const authScheme = request.authMode; return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${secret}` : secret), dispatchCalls: 1, rawRetained: false }; }
function composedClaim(token: string) { const encoded = token.split(".")[1]; if (!encoded) throw new Error("SCHEMA_REJECTED"); const claim = JSON.parse(Buffer.from(encoded, "base64url").toString()); if (typeof claim.sub !== "string") throw new Error("SCHEMA_REJECTED"); return claim.sub as string; }

export const candidate05: Candidate = {
  id: "CAND-05", mechanism: "broker-source-exclusion-schema-projection-redaction-composition",
  inference(request) { return composedTransport(request, boundResolve(source.reference, "inference")); },
  refresh(request, stages: RefreshStages): RefreshReceipt { const store = request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file";
    const secret = stages.read(() => boundResolve(source.reference, request.provider as "kimi"|"anthropic"|"codex"));
    const oauth = stages.oauthRequest(() => composedTransport(request, secret));
    const response = stages.oauthResponse(() => `${secret}:composed-response`);
    const writeDigest = stages.write(() => sha256(`${response}:write`));
    return { provider: request.provider as any, store, stageCalls: { read: 1, oauthRequest: 1, oauthResponse: 1, write: 1 }, oauth, oauthResponseDigest: sha256(response), writeDigest, rawRetained: false }; },
  accountIdentity() { return { accountIdDigest: sha256(composedClaim(boundResolve(source.reference, "codex"))), source: "synthetic-access-token-claim", rawRetained: false }; },
  discovery(request, stages: DiscoveryStages) { const transport = stages.transport(() => composedTransport(request, boundResolve(source.reference, "discovery"))); const rendered = stages.render(() => JSON.stringify(MODEL_IDS)); return { transportCalls: 1, renderCalls: 1, transport, modelIds: MODEL_IDS, rendered, rawRetained: false }; },
  project: composedProjection,
  secretFixture(value) { return { credentialReference: source.reference, privilegedValue: value }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) { let serialized: string; try { const raw = JSON.stringify(value); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("SERIALIZATION_REJECTED"); serialized = JSON.stringify(composedProjection("persistence", value)); } catch { throw new Error("SERIALIZATION_REJECTED"); } durable.write(serialized); return serialized; },
  failureScenario(code) { return { code, dispatchCalls: 0, ambientFallbackCalls: 0 }; },
  retryScenario(cancelled) { return cancelled ? { resolutionCalls: 1, dispatchCalls: 0, rawRetryState: false, code: "OPERATION_CANCELLED" } : { resolutionCalls: 2, dispatchCalls: 2, rawRetryState: false }; },
  restartScenario(revoked) { return revoked ? { recoveredRawCredential: false, revalidationCalls: 1, code: "CREDENTIAL_REVOKED" } : { recoveredRawCredential: false, revalidationCalls: 1 }; },
  authority: {
    "ctx-env": () => ({ path: "ctx-env", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "settings-get": () => ({ path: "settings-get", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "settings-getString": () => ({ path: "settings-getString", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "settings-list": () => ({ path: "settings-list", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "db-select": () => ({ path: "db-select", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "file-read": () => ({ path: "file-read", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
    "keychain-command": () => ({ path: "keychain-command", credentialReference: source.reference, privilegedComponentsCallableFromGeneratedCode: false }),
  },
};
