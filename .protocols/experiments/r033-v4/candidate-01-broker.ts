import type { Candidate, DiscoveryReceipt, DurableSpy, Layer, RefreshReceipt, SyntheticRequest, TransportReceipt } from "./contracts";
import { OPAQUE_REFERENCE, SENTINEL, sha256 } from "./fixtures";

const reference = OPAQUE_REFERENCE;
const brokerVault = new Map([[reference, SENTINEL]]);

function brokerResolve(boundReference: string): string {
  if (boundReference !== reference) throw new Error("CREDENTIAL_REFERENCE_INVALID");
  const credential = brokerVault.get(boundReference);
  if (!credential) throw new Error("CREDENTIAL_BOUNDARY_UNAVAILABLE");
  return credential;
}

function brokerInferenceTransport(request: SyntheticRequest): TransportReceipt {
  const credential = brokerResolve(reference);
  const authScheme = request.authMode;
  return { operation: request.operation, requestDigest: sha256(JSON.stringify(request)), authScheme, authDigest: sha256(authScheme === "bearer" ? `Bearer ${credential}` : credential), rawRetained: false };
}

function brokerRefreshOAuth(request: SyntheticRequest): TransportReceipt {
  const credential = brokerResolve(reference);
  return { operation: "refresh", requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer", authDigest: sha256(`Bearer ${credential}`), rawRetained: false };
}

function brokerDiscoveryTransport(request: SyntheticRequest): TransportReceipt {
  const credential = brokerResolve(reference);
  return { operation: "discovery", requestDigest: sha256(JSON.stringify(request)), authScheme: "bearer", authDigest: sha256(`Bearer ${credential}`), rawRetained: false };
}

function omitAtBoundary(layer: Layer, value: unknown): unknown {
  return { layer, valueDigest: sha256(JSON.stringify(value)), credential: "[BROKER-BOUNDARY]" };
}

export const candidate01: Candidate = {
  id: "CAND-01",
  mechanism: "opaque-reference-bound-credential-broker",
  inference: brokerInferenceTransport,
  refresh(request): RefreshReceipt {
    const current = brokerResolve(reference);
    const oauth = brokerRefreshOAuth(request);
    const rotated = `${current}:rotated`;
    return { read: request.provider === "anthropic" ? "synthetic-keychain" : "synthetic-file", oauth, oauthResponseDigest: sha256(`${current}:oauth-response`), writeDigest: sha256(rotated), rawRetained: false };
  },
  discovery(request): DiscoveryReceipt {
    return { transport: brokerDiscoveryTransport(request), modelIds: ["fixture-model-a", "fixture-model-b"], rendered: "<option>fixture-model-a</option><option>fixture-model-b</option>" };
  },
  discoveryFailure(_request) { return "CREDENTIAL_BOUNDARY_UNAVAILABLE"; },
  accountIdentity() { return { accountIdDigest: sha256(`${brokerResolve(reference)}:account`), source: "synthetic-access-token-claim", rawRetained: false }; },
  secretFixture(value) { return { brokerPrivateCredential: value }; },
  project: omitAtBoundary,
  serializeBeforeDurableWrite(value, durable: DurableSpy) {
    let serialized: string;
    try { serialized = JSON.stringify(omitAtBoundary("persistence", value)); }
    catch { throw new Error("SERIALIZATION_REJECTED"); }
    durable.write(serialized);
    return serialized;
  },
  authorityProbe() { return { credentialReference: reference, rawCredential: undefined, brokerCallableFromAgent: false }; },
};
