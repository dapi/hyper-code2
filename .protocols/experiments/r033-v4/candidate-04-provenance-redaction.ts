import type { Candidate, DurableSpy, Layer, SyntheticRequest } from "./contracts";
import { SENTINEL, sha256 } from "./fixtures";

type Tagged = Readonly<{ provenance: "declared-secret"; value: string }>;
const taggedInference: Tagged = Object.freeze({ provenance: "declared-secret", value: SENTINEL });
const taggedRefresh: Tagged = Object.freeze({ provenance: "declared-secret", value: `${SENTINEL}:refresh` });
const taggedDiscovery: Tagged = Object.freeze({ provenance: "declared-secret", value: `${SENTINEL}:discovery` });

function redactProvenance(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) throw new Error("SERIALIZATION_REJECTED");
  seen.add(value);
  if ((value as Partial<Tagged>).provenance === "declared-secret") return "[PROVENANCE-REDACTED]";
  if (Array.isArray(value)) return value.map(item => redactProvenance(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactProvenance(entry, seen)]));
}

function redactionInference(request: SyntheticRequest) {
  const authScheme = request.authMode;
  return { operation: "inference" as const, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${taggedInference.value}` : taggedInference.value), rawRetained: false as const };
}

function redactionRefresh(request: SyntheticRequest) {
  const oauth = { operation: "refresh" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${taggedRefresh.value}`), rawRetained: false as const };
  return { read: request.provider === "anthropic" ? "synthetic-keychain" as const : "synthetic-file" as const, oauth, oauthResponseDigest: sha256(`${taggedRefresh.value}:oauth-response`), writeDigest: sha256(`${taggedRefresh.value}:rotated`), rawRetained: false as const };
}

function redactionDiscovery(request: SyntheticRequest) {
  const transport = { operation: "discovery" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${taggedDiscovery.value}`), rawRetained: false as const };
  return { transport, modelIds: ["fixture-model-a"], rendered: "<option>fixture-model-a</option>" };
}

export const candidate04: Candidate = {
  id: "CAND-04",
  mechanism: "provenance-tagged-values-with-sink-redaction",
  inference: redactionInference,
  refresh: redactionRefresh,
  discovery: redactionDiscovery,
  discoveryFailure(_request) { return "CREDENTIAL_BOUNDARY_UNAVAILABLE"; },
  accountIdentity() { return { accountIdDigest: sha256(`${taggedDiscovery.value}:account`), source: "synthetic-access-token-claim", rawRetained: false }; },
  secretFixture(value) { return { provenance: "declared-secret", value }; },
  project(layer: Layer, value: unknown) { return { layer, value: redactProvenance(value) }; },
  serializeBeforeDurableWrite(value, durable: DurableSpy) {
    let serialized: string;
    try { serialized = JSON.stringify({ layer: "persistence", value: redactProvenance(value) }); }
    catch { throw new Error("SERIALIZATION_REJECTED"); }
    durable.write(serialized);
    return serialized;
  },
  authorityProbe() { return { generatedContext: taggedInference, provenanceVisibleToAgent: true }; },
};
