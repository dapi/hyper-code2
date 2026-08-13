import type { Candidate, DurableSpy, Layer, SyntheticRequest } from "./contracts";
import { OPAQUE_REFERENCE, SENTINEL, sha256 } from "./fixtures";

const compositionReference = OPAQUE_REFERENCE;
const compositionSource = Object.freeze({ reference: compositionReference, inference: SENTINEL, refresh: `${SENTINEL}:refresh`, discovery: `${SENTINEL}:discovery` });
const projectionKeys = new Set(["status", "provider", "model", "models", "code", "credentialReference"]);

function compositionBroker(reference: string, operation: SyntheticRequest["operation"]): string {
  if (reference !== compositionSource.reference) throw new Error("CREDENTIAL_REFERENCE_INVALID");
  return compositionSource[operation];
}

function compositionProject(layer: Layer, value: unknown): unknown {
  const projected: Record<string, unknown> = { layer };
  if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) if (projectionKeys.has(key)) projected[key] = entry;
  return projected;
}

function compositionRedact(value: unknown): unknown {
  if (typeof value === "string" && value.includes("R018-NONSECRET")) return "[COMPOSITION-REDACTED]";
  if (Array.isArray(value)) return value.map(compositionRedact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, compositionRedact(entry)]));
  return value;
}

function compositionInference(request: SyntheticRequest) {
  const credential = compositionBroker(compositionReference, request.operation);
  const authScheme = request.authMode;
  return { operation: "inference" as const, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${credential}` : credential), rawRetained: false as const };
}

function compositionRefresh(request: SyntheticRequest) {
  const credential = compositionBroker(compositionReference, "refresh");
  const oauth = { operation: "refresh" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${credential}`), rawRetained: false as const };
  return { read: request.provider === "anthropic" ? "synthetic-keychain" as const : "synthetic-file" as const, oauth, oauthResponseDigest: sha256(`${credential}:oauth-response`), writeDigest: sha256(`${credential}:rotated`), rawRetained: false as const };
}

function compositionDiscovery(request: SyntheticRequest) {
  const credential = compositionBroker(compositionReference, "discovery");
  const transport = { operation: "discovery" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${credential}`), rawRetained: false as const };
  return { transport, modelIds: ["fixture-model-a"], rendered: "<option>fixture-model-a</option>" };
}

export const candidate05: Candidate = {
  id: "CAND-05",
  mechanism: "explicit-broker-source-exclusion-projection-redaction-composition",
  inference: compositionInference,
  refresh: compositionRefresh,
  discovery: compositionDiscovery,
  discoveryFailure(_request) { return "CREDENTIAL_BOUNDARY_UNAVAILABLE"; },
  accountIdentity() { return { accountIdDigest: sha256(`${compositionBroker(compositionReference, "discovery")}:account`), source: "synthetic-access-token-claim", rawRetained: false }; },
  secretFixture(value) { return { credentialReference: compositionReference, privilegedValue: value }; },
  project(layer, value) { return compositionRedact(compositionProject(layer, value)); },
  serializeBeforeDurableWrite(value, durable: DurableSpy) {
    let serialized: string;
    try {
      JSON.stringify(value);
      serialized = JSON.stringify(compositionRedact(compositionProject("persistence", value)));
    }
    catch { throw new Error("SERIALIZATION_REJECTED"); }
    durable.write(serialized);
    return serialized;
  },
  authorityProbe() { return { credentialReference: compositionReference, rawCredential: undefined, privilegedComponentsCallableFromAgent: false, projection: [...projectionKeys].sort() }; },
};
