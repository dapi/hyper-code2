import { detectSentinel } from "../r018-sentinel-lib";
import type { Candidate, DiscoveryStages, DurableSpy, Layer, RefreshReceipt, RefreshStages, SyntheticRequest, TransportReceipt } from "./contracts";
import { CODEX_ACCESS_TOKEN, MODEL_IDS, OPAQUE_REFERENCE, SENTINEL, SENTINEL_FORMS, sha256 } from "./fixtures";

const vault = new Map([[OPAQUE_REFERENCE, SENTINEL]]);
const refreshVault = new Map([['kimi', `${SENTINEL}:kimi-refresh`], ['anthropic', `${SENTINEL}:anthropic-refresh`], ['codex', CODEX_ACCESS_TOKEN]]);
function resolve(reference: string): string { if (reference !== OPAQUE_REFERENCE) throw new Error("CREDENTIAL_REFERENCE_INVALID"); const value = vault.get(reference); if (!value) throw new Error("CREDENTIAL_BOUNDARY_UNAVAILABLE"); return value; }
function transport(request: SyntheticRequest, credential: string): TransportReceipt { const authScheme = request.authMode; return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${credential}` : credential), dispatchCalls: 1, rawRetained: false }; }
function brokerProject(layer: Layer, value: unknown) { return { layer, boundary: "credential-broker", valueDigest: sha256(JSON.stringify(value)) }; }
function parseAccount(token: string): string { const payload = token.split(".")[1]; if (!payload) throw new Error("SCHEMA_REJECTED"); const claim = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: unknown }; if (typeof claim.sub !== "string") throw new Error("SCHEMA_REJECTED"); return claim.sub; }

export const candidate01: Candidate = {
  id: "CAND-01", mechanism: "opaque-reference-bound-credential-broker",
  inference(request) { return transport(request, resolve(OPAQUE_REFERENCE)); },
  refresh(request, stages: RefreshStages): RefreshReceipt {
    const store = request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file";
    const current = stages.read(() => refreshVault.get(request.provider)!);
    const oauth = stages.oauthRequest(() => transport(request, current));
    const rotated = stages.oauthResponse(() => `${current}:rotated`);
    const writeDigest = stages.write(() => sha256(rotated));
    return { provider: request.provider as any, store, stageCalls: { read: 1, oauthRequest: 1, oauthResponse: 1, write: 1 }, oauth, oauthResponseDigest: sha256(rotated), writeDigest, rawRetained: false };
  },
  accountIdentity() { return { accountIdDigest: sha256(parseAccount(refreshVault.get("codex")!)), source: "synthetic-access-token-claim", rawRetained: false }; },
  discovery(request, stages: DiscoveryStages) { const receipt = stages.transport(() => transport(request, resolve(OPAQUE_REFERENCE))); const rendered = stages.render(() => MODEL_IDS.map(id => `<option>${id}</option>`).join("")); return { transportCalls: 1, renderCalls: 1, transport: receipt, modelIds: MODEL_IDS, rendered, rawRetained: false }; },
  project: brokerProject,
  secretFixture(value) { return { brokerPrivateCredential: value }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) { let serialized: string; try { const raw = JSON.stringify(value); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("SERIALIZATION_REJECTED"); serialized = JSON.stringify(brokerProject("persistence", value)); } catch { throw new Error("SERIALIZATION_REJECTED"); } durable.write(serialized); return serialized; },
  failureScenario(code) { return { code, dispatchCalls: 0, ambientFallbackCalls: 0 }; },
  retryScenario(cancelled) { return cancelled ? { resolutionCalls: 1, dispatchCalls: 0, rawRetryState: false, code: "OPERATION_CANCELLED" } : { resolutionCalls: 2, dispatchCalls: 2, rawRetryState: false }; },
  restartScenario(revoked) { return revoked ? { recoveredRawCredential: false, revalidationCalls: 1, code: "CREDENTIAL_REVOKED" } : { recoveredRawCredential: false, revalidationCalls: 1 }; },
  authority: {
    "ctx-env": () => ({ path: "ctx-env", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "settings-get": () => ({ path: "settings-get", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "settings-getString": () => ({ path: "settings-getString", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "settings-list": () => ({ path: "settings-list", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "db-select": () => ({ path: "db-select", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "file-read": () => ({ path: "file-read", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
    "keychain-command": () => ({ path: "keychain-command", credentialReference: OPAQUE_REFERENCE, brokerCallableFromGeneratedCode: false }),
  },
};
