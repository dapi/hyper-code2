import type { Candidate, DurableSpy, Layer, SyntheticRequest, TransportReceipt } from "./contracts";
import { SENTINEL, sha256 } from "./fixtures";

const agentContext = Object.freeze({ provider: "fixture", credential: undefined, refresh: undefined, discoveryCredential: undefined });
const privilegedSources = Object.freeze({ inference: SENTINEL, refresh: `${SENTINEL}:refresh`, discovery: `${SENTINEL}:discovery` });

function privilegedInference(request: SyntheticRequest): TransportReceipt {
  const credential = privilegedSources.inference;
  const authScheme = request.authMode;
  return { operation: "inference", requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${credential}` : credential), rawRetained: false };
}

function privilegedRefresh(request: SyntheticRequest) {
  const oauth = { operation: "refresh" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${privilegedSources.refresh}`), rawRetained: false as const };
  return { read: request.provider === "anthropic" ? "synthetic-keychain" as const : "synthetic-file" as const, oauth, oauthResponseDigest: sha256(`${privilegedSources.refresh}:oauth-response`), writeDigest: sha256(`${privilegedSources.refresh}:rotated`), rawRetained: false as const };
}

function privilegedDiscovery(request: SyntheticRequest) {
  const transport = { operation: "discovery" as const, requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer" as const, authDigest: sha256(`Bearer ${privilegedSources.discovery}`), rawRetained: false as const };
  return { transport, modelIds: ["fixture-model-a"], rendered: "<option>fixture-model-a</option>" };
}

function sourceExcludedProjection(layer: Layer, value: unknown) { return { layer, publicDigest: sha256(JSON.stringify(value)), secretFields: [] }; }

export const candidate02: Candidate = {
  id: "CAND-02",
  mechanism: "source-excluded-agent-with-separate-privileged-transports",
  inference: privilegedInference,
  refresh: privilegedRefresh,
  discovery: privilegedDiscovery,
  discoveryFailure(_request) { return "CREDENTIAL_BOUNDARY_UNAVAILABLE"; },
  accountIdentity() { return { accountIdDigest: sha256(`${privilegedSources.discovery}:account`), source: "synthetic-access-token-claim", rawRetained: false }; },
  secretFixture(value) { return { privilegedSourceValue: value }; },
  project: sourceExcludedProjection,
  serializeBeforeDurableWrite(value, durable: DurableSpy) {
    let serialized: string;
    try { serialized = JSON.stringify(sourceExcludedProjection("persistence", value)); }
    catch { throw new Error("SERIALIZATION_REJECTED"); }
    durable.write(serialized);
    return serialized;
  },
  authorityProbe() { return { ...agentContext, privilegedTransportCallableFromAgent: false }; },
};
