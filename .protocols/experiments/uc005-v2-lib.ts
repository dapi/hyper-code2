import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]"],
  [/\b(?:sk|sess|key|token)-[A-Za-z0-9_-]{12,}\b/gi, "[REDACTED_TOKEN]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]"],
  [/(?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization)([\"']?\s*[:=]\s*[\"']?)[^\s,\"'}]{8,}/gi, "$1[REDACTED]"],
];

export function sanitizeText(input: string, literals: string[] = []): string {
  let out = input;
  for (const literal of literals.filter(Boolean).sort((a, b) => b.length - a.length)) {
    out = out.split(literal).join("[REDACTED_PATH_OR_SENTINEL]");
  }
  for (const [pattern, replacement] of SECRET_PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

export function sanitizeJson(value: unknown, literals: string[] = []): Json {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return sanitizeText(value, literals);
  if (Array.isArray(value)) return value.map((item) => sanitizeJson(item, literals));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      /secret|credential|authorization|api.?key|access.?token|refresh.?token/i.test(key) ? `${key}_redacted` : key,
      /secret|credential|authorization|api.?key|access.?token|refresh.?token/i.test(key) ? "[REDACTED]" : sanitizeJson(item, literals),
    ])) as { [key: string]: Json };
  }
  return sanitizeText(String(value), literals);
}

export async function sha256File(path: string): Promise<string> {
  const bytes = await Bun.file(path).arrayBuffer();
  return createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
}

export async function inventory(root: string): Promise<Record<string, { bytes: number; sha256: string }>> {
  const result: Record<string, { bytes: number; sha256: string }> = {};
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else if (entry.isFile()) {
        const info = await stat(abs);
        result[relative(root, abs)] = { bytes: info.size, sha256: await sha256File(abs) };
      }
    }
  }
  await walk(root);
  return result;
}

export function parseJsonValue(text: string | null): unknown {
  if (!text) return null;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1]?.trim();
  for (const candidate of [fenced, text.trim()]) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch {}
  }
  const start = Math.min(...[text.indexOf("["), text.indexOf("{")].filter((x) => x >= 0));
  if (Number.isFinite(start)) {
    for (let end = text.length; end > start; end--) {
      try { return JSON.parse(text.slice(start, end)); } catch {}
    }
  }
  return null;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
