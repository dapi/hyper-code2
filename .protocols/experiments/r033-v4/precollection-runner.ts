import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { CANDIDATE_IDS } from "./contracts";
import { CC_PLAN } from "./fixtures";
import { currentInstrumentHashes, fixturePlanDigest } from "./instrument";

// This runner is a pre-collection containment/provenance design. It emits no
// candidate result and must not be invoked as candidate collection.
const repo = resolve(import.meta.dir, "../../..");
const outputRoot = resolve(process.argv[2] ?? "");
if (!process.argv[2] || !outputRoot.startsWith(resolve(repo, ".protocols/experiments/runs/R-033/precollection-"))) throw new Error("R033_V4_WRITE_ROOT_REQUIRED");
const sandbox = Bun.which("sandbox-exec");
const bun = Bun.which("bun") ?? process.execPath;
if (process.platform !== "darwin" || !sandbox) throw new Error("R033_V4_SANDBOX_REQUIRED");
const root = await realpath(await mkdtemp(join(tmpdir(), "r033-v4-precollection-")));
const home = join(root, "home"); const work = join(root, "work"); const temp = join(root, "tmp");
await Promise.all([mkdir(home), mkdir(work), mkdir(temp), mkdir(outputRoot, { recursive: true })]);
const operatorHome = process.env.HOME;
if (!operatorHome) throw new Error("R033_V4_HOME_PATH_REQUIRED");
const homeProbe = join(operatorHome, ".zshrc");
const keychainProbe = join(operatorHome, "Library/Keychains/login.keychain-db");
const outside = await realpath(await mkdtemp(join(tmpdir(), "r033-v4-denied-")));
const esc = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
const profile = `(version 1)\n(deny default)\n(allow process*)\n(allow sysctl-read)\n(allow file-read-metadata)\n(allow file-read* (require-not (subpath "${esc(operatorHome)}")))\n(allow file-read* (literal "${esc(bun)}") (subpath "${esc(repo)}") (subpath "${esc(root)}"))\n(allow file-write* (subpath "${esc(root)}"))`;
const rawPath = join(root, "precollection.json"); const configPath = join(root, "config.json");
await Bun.write(configPath, JSON.stringify({ outputPath: rawPath, homeProbe, keychainProbe, outsideWrite: join(outside, "denied") }));
const env = { HOME: home, LANG: "C.UTF-8", LC_ALL: "C.UTF-8", NO_COLOR: "1", PATH: "/usr/bin:/bin", TMPDIR: temp };
const child = Bun.spawn([sandbox, "-p", profile, bun, resolve(import.meta.dir, "precollection-child.ts"), configPath], { cwd: work, env, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
if (exit) throw new Error(`R033_V4_PREFLIGHT_CHILD_${stderr}`);
const preflight = await Bun.file(rawPath).json();
const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const perCellChecksumPlan = CANDIDATE_IDS.flatMap(candidate => CC_PLAN.map(cell => ({ candidate, cell: cell.cell, casesDigest: sha(JSON.stringify(cell.cases)), requiredResultChecksum: true })));
const provenancePlan = { exactHead: true, platform: true, bun: true, git: true, sourceSha256: true, sentinelLibrarySha256: true, instrumentSha256: await currentInstrumentHashes(), fixturePlanSha256: fixturePlanDigest(), sandboxProfileSha256: sha(profile), environmentKeys: Object.keys(env).sort(), perCellChecksums: perCellChecksumPlan.length };
await Bun.write(join(outputRoot, "precollection.json"), JSON.stringify({ preflight, provenancePlan, perCellChecksumPlan, stdoutSha256: sha(stdout), stderrSha256: sha(stderr) }, null, 2) + "\n");
await Bun.write(join(outputRoot, "README.md"), "# R-033 V4.1 pre-collection containment receipt\n\nNo candidate comparison was collected. This receipt is only containment and frozen-plan provenance.\n");
for (const name of ["precollection.json", "README.md"]) await readFile(join(outputRoot, name));
