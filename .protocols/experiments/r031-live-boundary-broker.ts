import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256, stableJson } from "./r031-offline-lib";

const configPath = process.argv[2];
assert(configPath, "config path required");
const config = JSON.parse(await readFile(configPath, "utf8")) as { mailboxRoot: string; mode: string };
assert.equal(config.mode, "offline-mock", "live/provider mode requires a separately authorized instrument version");
let handled = 0;

while (true) {
    const stopPath = join(config.mailboxRoot, "STOP");
    if (await Bun.file(stopPath).exists()) break;
    const requests: string[] = [];
    async function collect(directory: string) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await collect(path);
            else if (entry.isFile() && entry.name.endsWith(".request.json")) requests.push(path);
        }
    }
    await collect(config.mailboxRoot);
    for (const requestPath of requests.sort()) {
        const responsePath = requestPath.replace(/\.request\.json$/, ".response.json");
        if (await Bun.file(responsePath).exists()) continue;
        const request = JSON.parse(await readFile(requestPath, "utf8"));
        handled += 1;
        await writeFile(responsePath, stableJson({
            ok: true,
            mode: "offline-mock",
            providerCalls: 0,
            requestSha256: sha256(stableJson(request)),
            result: { kind: "boundary-ack", caseId: request.caseId },
        }));
    }
    await Bun.sleep(10);
}
process.stdout.write(stableJson({ schemaVersion: 1, mode: config.mode, handled, providerCalls: 0 }));
