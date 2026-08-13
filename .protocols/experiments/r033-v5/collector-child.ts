import { readFile, writeFile } from "node:fs/promises";
import { detectSentinel } from "../r018-sentinel-lib";
import { SENTINEL_FORMS } from "./fixtures";
import { executeRotatingMatrix, sanitizedResult } from "./instrument";

type Config = Readonly<{ outputPath: string; operatorHomeProbe: string; keychainProbe: string; outsideWrite: string }>;
const config = await Bun.file(process.argv[2]!).json() as Config;
const networkCalls: string[] = [];
const deny = (name: string) => (..._args: unknown[]) => { networkCalls.push(name); throw new Error(`R033_V5_NETWORK_DENIED_${name}`); };
const old = { fetch: globalThis.fetch, serve: Bun.serve, connect: (Bun as any).connect, WebSocket: globalThis.WebSocket };
(globalThis as any).fetch = deny("fetch"); (Bun as any).serve = deny("serve"); (Bun as any).connect = deny("connect");
(globalThis as any).WebSocket = class { constructor() { return deny("WebSocket")(); } };
async function denied(operation: () => Promise<unknown>) { try { await operation(); return false; } catch { return true; } }
try {
  const containment = {
    environmentKeys: Object.keys(process.env).sort(),
    credentialLikeKeys: Object.keys(process.env).filter(key => /AUTH|TOKEN|SECRET|KEY|CREDENTIAL/i.test(key)),
    operatorHomeReadDenied: await denied(() => readFile(config.operatorHomeProbe)),
    keychainReadDenied: await denied(() => readFile(config.keychainProbe)),
    outsideWriteDenied: await denied(() => writeFile(config.outsideWrite, "denied")),
    listenerDenied: await denied(async () => { (Bun as any).serve({ port: 0, fetch() {} }); }),
    connectDenied: await denied(async () => { (Bun as any).connect({ hostname: "127.0.0.1", port: 9, socket: {} }); }),
    fetchDenied: await denied(async () => { await fetch("https://mock.invalid"); }),
  };
  if (containment.credentialLikeKeys.length || !containment.operatorHomeReadDenied || !containment.keychainReadDenied || !containment.outsideWriteDenied || !containment.listenerDenied || !containment.connectDenied || !containment.fetchDenied) throw new Error("R033_V5_CONTAINMENT_CONTROL_FAILED");
  const results = executeRotatingMatrix().map(sanitizedResult);
  if (results.length !== 70) throw new Error("R033_V5_MATRIX_CARDINALITY");
  const serialized = JSON.stringify({ schemaVersion: "5.2", containment, networkCalls, results });
  if (detectSentinel(serialized, SENTINEL_FORMS).length) throw new Error("R033_V5_STABLE_CARRIER_SECRET");
  await Bun.write(config.outputPath, serialized + "\n");
} finally {
  (globalThis as any).fetch = old.fetch; (Bun as any).serve = old.serve; (Bun as any).connect = old.connect; (globalThis as any).WebSocket = old.WebSocket;
}
