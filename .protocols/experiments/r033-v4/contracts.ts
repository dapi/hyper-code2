export const CANDIDATE_IDS = ["CAND-01", "CAND-02", "CAND-03", "CAND-04", "CAND-05"] as const;
export type CandidateId = typeof CANDIDATE_IDS[number];

export const LAYERS = [
  "agent-context",
  "model-input",
  "action-result",
  "persistence",
  "render",
  "diagnostic",
  "retry-state",
  "restart-state",
] as const;
export type Layer = typeof LAYERS[number];

export type StableCode =
  | "CREDENTIAL_REFERENCE_INVALID"
  | "CREDENTIAL_REVOKED"
  | "CREDENTIAL_EXPIRED"
  | "CREDENTIAL_BOUNDARY_UNAVAILABLE"
  | "CLASSIFICATION_REQUIRED"
  | "SCHEMA_REJECTED"
  | "SERIALIZATION_REJECTED";

export type SyntheticRequest = Readonly<{
  operation: "inference" | "refresh" | "discovery";
  provider: "openai" | "anthropic" | "kimi" | "codex";
  authMode: "bearer" | "x-api-key";
  url: string;
  method: "GET" | "POST";
  nonSecretHeaders: Readonly<Record<string, string>>;
  body: Readonly<Record<string, unknown>>;
}>;

export type TransportReceipt = Readonly<{
  operation: SyntheticRequest["operation"];
  requestDigest: string;
  authScheme: "bearer" | "x-api-key";
  authDigest: string;
  rawRetained: false;
}>;

export type RefreshReceipt = Readonly<{
  read: "synthetic-file" | "synthetic-keychain";
  oauth: TransportReceipt;
  oauthResponseDigest: string;
  writeDigest: string;
  rawRetained: false;
}>;

export type DiscoveryReceipt = Readonly<{
  transport: TransportReceipt;
  modelIds: readonly string[];
  rendered: string;
}>;

export type AccountReceipt = Readonly<{
  accountIdDigest: string;
  source: "synthetic-access-token-claim";
  rawRetained: false;
}>;

export type DurableSpy = {
  calls: number;
  payloads: string[];
  write(serialized: string): void;
};

export function durableSpy(): DurableSpy {
  return {
    calls: 0,
    payloads: [],
    write(serialized: string) {
      this.calls += 1;
      this.payloads.push(serialized);
    },
  };
}

export type Candidate = Readonly<{
  id: CandidateId;
  mechanism: string;
  inference(request: SyntheticRequest): TransportReceipt;
  refresh(request: SyntheticRequest): RefreshReceipt;
  discovery(request: SyntheticRequest): DiscoveryReceipt;
  discoveryFailure(request: SyntheticRequest): StableCode;
  accountIdentity(): AccountReceipt;
  secretFixture(value: string): unknown;
  project(layer: Layer, value: unknown): unknown;
  serializeBeforeDurableWrite(value: unknown, durable: DurableSpy): string;
  authorityProbe(): Readonly<Record<string, unknown>>;
}>;
