export const CANDIDATE_IDS = ["CAND-01", "CAND-02", "CAND-03", "CAND-04", "CAND-05"] as const;
export type CandidateId = typeof CANDIDATE_IDS[number];

export const CELLS = Array.from({ length: 14 }, (_, index) => `CC-${String(index + 1).padStart(2, "0")}`) as `CC-${string}`[];
export const LAYERS = ["agent-context", "model-input", "action-result", "persistence", "render", "diagnostic", "retry-state", "restart-state"] as const;
export const AUTHORITY_PATHS = ["ctx-env", "settings-get", "settings-getString", "settings-list", "db-select", "file-read", "keychain-command"] as const;
export const REFRESH_FAILURE_STAGES = ["read", "oauth-request", "oauth-response", "write"] as const;

export type Layer = typeof LAYERS[number];
export type AuthorityPath = typeof AUTHORITY_PATHS[number];
export type RefreshFailureStage = typeof REFRESH_FAILURE_STAGES[number];
export type StableCode =
  | "CREDENTIAL_REFERENCE_INVALID" | "CREDENTIAL_REVOKED" | "CREDENTIAL_EXPIRED"
  | "CREDENTIAL_BOUNDARY_UNAVAILABLE" | "CLASSIFICATION_REQUIRED" | "SCHEMA_REJECTED"
  | "SERIALIZATION_REJECTED" | "OPERATION_CANCELLED" | "RESTART_REVALIDATION_REQUIRED"
  | "DISCOVERY_UNAVAILABLE" | `REFRESH_${Uppercase<RefreshFailureStage>}_FAILED`;

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
  dispatchCalls: number;
  rawRetained: false;
}>;

export type RefreshReceipt = Readonly<{
  provider: "kimi" | "anthropic" | "codex";
  store: "synthetic-file" | "synthetic-keychain";
  stageCalls: Readonly<Record<"read" | "oauthRequest" | "oauthResponse" | "write", number>>;
  oauth?: TransportReceipt;
  oauthResponseDigest?: string;
  writeDigest?: string;
  failureCode?: StableCode;
  rawRetained: false;
}>;

export type DiscoveryReceipt = Readonly<{
  transportCalls: number;
  renderCalls: number;
  transport?: TransportReceipt;
  modelIds: readonly string[];
  rendered?: string;
  failureCode?: StableCode;
  rawRetained: false;
}>;

export type DurableSpy = { calls: number; payloadDigests: string[]; write(serialized: string): void };
export function durableSpy(hash: (value: string) => string): DurableSpy {
  return { calls: 0, payloadDigests: [], write(serialized) { this.calls += 1; this.payloadDigests.push(hash(serialized)); } };
}

export type RefreshStages = Readonly<{
  read<T>(operation: () => T): T;
  oauthRequest<T>(operation: () => T): T;
  oauthResponse<T>(operation: () => T): T;
  write<T>(operation: () => T): T;
}>;

export type DiscoveryStages = Readonly<{
  transport<T>(operation: () => T): T;
  render<T>(operation: () => T): T;
}>;

export type AuthorityAdapters = Readonly<Record<AuthorityPath, () => unknown>>;

export type Candidate = Readonly<{
  id: CandidateId;
  mechanism: string;
  inference(request: SyntheticRequest): TransportReceipt;
  refresh(request: SyntheticRequest, stages: RefreshStages): RefreshReceipt;
  accountIdentity(): Readonly<{ accountIdDigest: string; source: "synthetic-access-token-claim"; rawRetained: false }>;
  discovery(request: SyntheticRequest, stages: DiscoveryStages): DiscoveryReceipt;
  project(layer: Layer, value: unknown): unknown;
  secretFixture(value: string): unknown;
  serializeBeforeDurableWrite(value: unknown, durable: DurableSpy): string;
  failureScenario(code: StableCode): Readonly<{ code: StableCode; dispatchCalls: 0; ambientFallbackCalls: 0 }>;
  retryScenario(cancelled: boolean): Readonly<{ resolutionCalls: number; dispatchCalls: number; rawRetryState: false; code?: StableCode }>;
  restartScenario(revoked: boolean): Readonly<{ recoveredRawCredential: false; revalidationCalls: 1; code?: StableCode }>;
  authority: AuthorityAdapters;
}>;

export type CellResult = Readonly<{
  candidate: CandidateId;
  cell: `CC-${string}`;
  status: "pass" | "fail" | "incompatible";
  observations: Readonly<Record<string, unknown>>;
}>;
