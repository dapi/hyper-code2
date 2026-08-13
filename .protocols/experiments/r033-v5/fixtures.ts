import { createHash } from "node:crypto";
import { SENTINEL, sentinelForms } from "../r018-sentinel-lib";
import type { SyntheticRequest } from "./contracts";

export { SENTINEL };
export const SENTINEL_FORMS = Object.freeze(sentinelForms(SENTINEL));
export const CLEAN_VALUE = Object.freeze({ status: "clean", provider: "fixture", model: "fixture-model" });
export const OPAQUE_REFERENCE = "credref:r033-v5/provider/account/fixture";
export const MODEL_IDS = Object.freeze(["fixture-model-a", "fixture-model-b"]);

export function sha256(value: string | Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
export function base64url(value: string): string { return Buffer.from(value).toString("base64url"); }
export const CODEX_ACCESS_TOKEN = `fixture.${base64url(JSON.stringify({ sub: "acct-fixture-42", iss: "synthetic" }))}.signature`;

export const INFERENCE_REQUESTS: readonly SyntheticRequest[] = Object.freeze([
  Object.freeze({ operation: "inference", provider: "openai", authMode: "bearer", url: "https://mock.invalid/v1/chat/completions", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json" }), body: Object.freeze({ model: "fixture-openai", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "anthropic", authMode: "x-api-key", url: "https://mock.invalid/v1/messages", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json", "anthropic-version": "2023-06-01" }), body: Object.freeze({ model: "fixture-anthropic-key", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "anthropic", authMode: "bearer", url: "https://mock.invalid/v1/messages", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json" }), body: Object.freeze({ model: "fixture-anthropic-oauth", messages: Object.freeze([{ role: "user", content: "ping" }]) }) }),
  Object.freeze({ operation: "inference", provider: "codex", authMode: "bearer", url: "https://mock.invalid/v1/responses", method: "POST", nonSecretHeaders: Object.freeze({ "content-type": "application/json" }), body: Object.freeze({ model: "fixture-codex", input: "ping" }) }),
]);

export const REFRESH_REQUESTS: readonly SyntheticRequest[] = Object.freeze([
  Object.freeze({ operation: "refresh", provider: "kimi", authMode: "bearer", url: "https://mock.invalid/kimi/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "x-store": "synthetic-file" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
  Object.freeze({ operation: "refresh", provider: "anthropic", authMode: "bearer", url: "https://mock.invalid/anthropic/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "x-store": "synthetic-keychain" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
  Object.freeze({ operation: "refresh", provider: "codex", authMode: "bearer", url: "https://mock.invalid/codex/oauth/token", method: "POST", nonSecretHeaders: Object.freeze({ "x-store": "synthetic-file" }), body: Object.freeze({ grant_type: "refresh_token" }) }),
]);

export const DISCOVERY_REQUEST: SyntheticRequest = Object.freeze({ operation: "discovery", provider: "codex", authMode: "bearer", url: "https://mock.invalid/models", method: "GET", nonSecretHeaders: Object.freeze({ accept: "application/json" }), body: Object.freeze({}) });
export const SECRET_SUCCESS = Object.freeze({ status: "ok", credential: SENTINEL });
export const SECRET_THROW = Object.freeze({ name: "SyntheticProviderError", message: SENTINEL });
export function secretBearingCycle(): Record<string, unknown> { const value: Record<string, unknown> = { credential: SENTINEL }; value.self = value; return value; }

export const FIXTURE_PLAN = Object.freeze({
  candidates: Object.freeze(["CAND-01", "CAND-02", "CAND-03", "CAND-04", "CAND-05"]),
  cells: Object.freeze(Array.from({ length: 14 }, (_, index) => `CC-${String(index + 1).padStart(2, "0")}`)),
  rotatingOrders: Object.freeze(Array.from({ length: 5 }, (_, start) => Array.from({ length: 5 }, (_, offset) => `CAND-${String(((start + offset) % 5) + 1).padStart(2, "0")}`))),
  inference: INFERENCE_REQUESTS,
  refresh: REFRESH_REQUESTS,
  discovery: DISCOVERY_REQUEST,
  refreshFailureStages: Object.freeze(["read", "oauth-request", "oauth-response", "write"]),
  layers: Object.freeze(["agent-context", "model-input", "action-result", "persistence", "render", "diagnostic", "retry-state", "restart-state"]),
  authorityPaths: Object.freeze(["ctx-env", "settings-get", "settings-getString", "settings-list", "db-select", "file-read", "keychain-command"]),
  sentinelForms: Object.freeze(SENTINEL_FORMS.map(form => Object.freeze({ id: form.id, values: form.values.length }))),
});
export function fixturePlanDigest(): string { return sha256(JSON.stringify(FIXTURE_PLAN)); }
