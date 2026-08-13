import { createHash } from "node:crypto";

import { SENTINEL, sentinelForms } from "../r018-sentinel-lib";
import type { SyntheticRequest } from "./contracts";

export { SENTINEL };
export const SENTINEL_FORMS = Object.freeze(sentinelForms(SENTINEL));
export const OPAQUE_REFERENCE = "credref:r033-v4/provider/account/fixture";
export const CLEAN_VALUE = Object.freeze({ status: "clean", provider: "fixture" });

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export const INFERENCE_REQUESTS: readonly SyntheticRequest[] = Object.freeze([
  Object.freeze({ operation: "inference", provider: "openai", authMode: "bearer", url: "https://mock.invalid/v1/chat/completions", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json" }), body: Object.freeze({ model: "fixture-openai", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "anthropic", authMode: "x-api-key", url: "https://mock.invalid/v1/messages", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "anthropic-version": "2023-06-01" }), body: Object.freeze({ model: "fixture-anthropic-key", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "anthropic", authMode: "bearer", url: "https://mock.invalid/v1/messages", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "anthropic-version": "2023-06-01" }), body: Object.freeze({ model: "fixture-anthropic-oauth", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "codex", authMode: "bearer", url: "https://mock.invalid/v1/responses", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json" }), body: Object.freeze({ model: "fixture-codex", input: "ping" }) }),
]);

export const REFRESH_REQUESTS: readonly SyntheticRequest[] = Object.freeze([
  Object.freeze({ operation: "refresh", provider: "kimi", authMode: "bearer", url: "https://mock.invalid/kimi/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "x-store": "synthetic-file" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
  Object.freeze({ operation: "refresh", provider: "anthropic", authMode: "bearer", url: "https://mock.invalid/anthropic/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "x-store": "synthetic-keychain" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
  Object.freeze({ operation: "refresh", provider: "codex", authMode: "bearer", url: "https://mock.invalid/codex/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "x-store": "synthetic-file" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
]);

export const DISCOVERY_REQUEST: SyntheticRequest = Object.freeze({
  operation: "discovery",
  provider: "codex",
  authMode: "bearer",
  url: "https://mock.invalid/models",
  method: "GET",
  nonSecretHeaders: Object.freeze({ accept: "application/json" }),
  body: Object.freeze({}),
});

export const FROZEN_REQUEST_DIGESTS = Object.freeze(Object.fromEntries(
  [...INFERENCE_REQUESTS, ...REFRESH_REQUESTS, DISCOVERY_REQUEST].map(request => [
    `${request.operation}:${request.provider}:${request.authMode}`,
    sha256(JSON.stringify(request)),
  ]),
));

export function secretBearingCycle(): Record<string, unknown> {
  const root: Record<string, unknown> = { credential: SENTINEL };
  root.self = root;
  return root;
}

export const SECRET_SUCCESS = Object.freeze({ status: "ok", credential: SENTINEL });
export const SECRET_THROW = Object.freeze({ name: "SyntheticProviderError", message: SENTINEL });
export const CC_PLAN = Object.freeze([
  { cell: "CC-01", cases: ["clean-negative"] },
  { cell: "CC-02", cases: ["S0-S8-detector", "auth-placement"] },
  { cell: "CC-03", cases: ["openai-bearer-inference"] },
  { cell: "CC-04", cases: ["anthropic-key-inference"] },
  { cell: "CC-05", cases: ["kimi-file-read-oauth-response-write", "anthropic-keychain-read-oauth-response-write", "anthropic-oauth-inference"] },
  { cell: "CC-06", cases: ["codex-file-read-oauth-response-write", "codex-account-derivation", "codex-inference"] },
  { cell: "CC-07", cases: ["unknown-reference", "revoked", "expired"] },
  { cell: "CC-08", cases: ["boundary-unavailable", "timeout", "no-ambient-fallback"] },
  { cell: "CC-09", cases: ["classification-loss", "schema-mismatch", "before-write"] },
  { cell: "CC-10", cases: ["secret-success", "secret-throw", "secret-cyclic-serialization"] },
  { cell: "CC-11", cases: ["retry", "cancellation", "bounded-reuse"] },
  { cell: "CC-12", cases: ["new-process-revalidation", "revocation-after-restart", "no-agent-secret-state"] },
  { cell: "CC-13", cases: ["discovery-request", "discovery-failure", "render-model-ids"] },
  { cell: "CC-14", cases: ["ctx-env", "settings-get", "settings-getString", "settings-list", "db-select", "file-read", "keychain-command"] },
]);
