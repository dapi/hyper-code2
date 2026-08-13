import { readFile, writeFile } from 'node:fs/promises';

import { CANDIDATES, CELLS, executeV3 } from './r033-v3-semantics';

type Config = { outputPath: string; homeProbe: string; keychainProbe: string; outsideWrite: string };
const config = await Bun.file(process.argv[2]).json() as Config;
async function denied(fn: () => Promise<unknown>) { try { await fn(); return false; } catch { return true; } }
const containment = {
    environmentKeys: Object.keys(process.env).sort(),
    credentialLikeKeys: Object.keys(process.env).filter(key => /AUTH|TOKEN|SECRET|KEY|CREDENTIAL/i.test(key)),
    homeReadDenied: await denied(() => readFile(config.homeProbe)),
    keychainReadDenied: await denied(() => readFile(config.keychainProbe)),
    outsideWriteDenied: await denied(() => writeFile(config.outsideWrite, 'denied')),
    listenerDenied: await denied(async () => { const server = Bun.listen({ hostname: '127.0.0.1', port: 0, socket: { data() {} } }); server.stop(true); }),
};
const results = CELLS.flatMap((cell, index) => CANDIDATES.map((_, offset) => CANDIDATES[(index + offset) % CANDIDATES.length]).map(candidate => executeV3(candidate, cell)));
await Bun.write(config.outputPath, JSON.stringify({ schemaVersion: 3, containment, results }));
