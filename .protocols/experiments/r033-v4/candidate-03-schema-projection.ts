import type { Candidate, DurableSpy, Layer, SyntheticRequest } from "./contracts";
import { SENTINEL, sha256 } from "./fixtures";

const sealedConfig = Object.freeze({ provider: "fixture", apiKey: SENTINEL, refreshToken: `${SENTINEL}:refresh`, discoveryToken: `${SENTINEL}:discovery` });
const allowedKeys = new Set(["status", "provider", "model", "models", "code"]);

function schemaProject(layer: Layer, value: unknown): unknown {
  if (value === null || typeof value !== "object") return { layer, value: "[SCHEMA-SCALAR-OMITTED]" };
  const projected: Record<string, unknown> = { layer };
  for (const [key, entry] of Object.entries(value)) if (allowedKeys.has(key)) projected[key] = entry;
  return projected;
}

function schemaInference(request: SyntheticRequest) {
  const scheme = request.authMode;
  return { operation: "inference" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: scheme, authDigest: sha256(scheme === "bearer" ? `Bearer ${sealedConfig.apiKey}` : sealedConfig.apiKey), rawRetained: false as const };
}

function schemaRefresh(request: SyntheticRequest) {
  const oauth = { operation: "refresh" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${sealedConfig.refreshToken}`), rawRetained: false as const };
  return { read: request.provider === "anthropic" ? "synthetic-keychain" as const : "synthetic-file" as const, oauth, oauthResponseDigest: sha256(`${sealedConfig.refreshToken}:oauth-response`), writeDigest: sha256(`${sealedConfig.refreshToken}:rotated`), rawRetained: false as const };
}

function schemaDiscovery(request: SyntheticRequest) {
  return { transport: { operation: "discovery" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${sealedConfig.discoveryToken}`), rawRetained: false as const }, modelIds: ["fixture-model-a"], rendered: "<option>fixture-model-a</option>" };
}

export const candidate03: Candidate = {
  id: "CAND-03",
  mechanism: "schema-owned-projection-with-sealed-secret-config",
  inference: schemaInference,
  refresh: schemaRefresh,
  discovery: schemaDiscovery,
  discoveryFailure(_request) { return "CREDENTIAL_BOUNDARY_UNAVAILABLE"; },
  accountIdentity() { return { accountIdDigest: sha256(`${sealedConfig.discoveryToken}:account`), source: "synthetic-access-token-claim", rawRetained: false }; },
  secretFixture(value) { return { apiKey: value }; },
  project: schemaProject,
  serializeBeforeDurableWrite(value, durable: DurableSpy) {
    let serialized: string;
    try {
      JSON.stringify(value);
      serialized = JSON.stringify(schemaProject("persistence", value));
    }
    catch { throw new Error("SERIALIZATION_REJECTED"); }
    durable.write(serialized);
    return serialized;
  },
  authorityProbe() { return { provider: sealedConfig.provider, apiKey: undefined, schema: [...allowedKeys].sort() }; },
};
