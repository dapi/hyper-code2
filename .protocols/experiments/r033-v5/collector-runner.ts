import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath } from "node:fs/promises";
import { arch, platform, release, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { detectSentinel } from "../r018-sentinel-lib";
import { SENTINEL_FORMS, fixturePlanDigest, sha256 } from "./fixtures";
import { assertPrecollectionGate, currentInstrumentHashes } from "./instrument";

const repo = resolve(import.meta.dir, "../../..");
const reviewPath = resolve(process.argv[2] ?? "");
const outputRoot = resolve(process.argv[3] ?? "");
if (!process.argv[2]) throw new Error("R033_V5_REVIEW_PATH_REQUIRED");
if (!process.argv[3] || !outputRoot.startsWith(resolve(repo, ".protocols/experiments/runs/R-033/v5-collection-"))) throw new Error("R033_V5_WRITE_ROOT_REQUIRED");
await assertPrecollectionGate(reviewPath); // STOP gate: no temp state or candidate execution before exact independent approval.

const sandbox = Bun.which("sandbox-exec"); const bun = Bun.which("bun") ?? process.execPath;
if (process.platform !== "darwin" || !sandbox) throw new Error("R033_V5_SANDBOX_REQUIRED");
const root = await realpath(await mkdtemp(join(tmpdir(), "r033-v5-collector-")));
const home = join(root, "home"), work = join(root, "work"), temp = join(root, "tmp");
await Promise.all([mkdir(home), mkdir(work), mkdir(temp)]);
const operatorHome = process.env.HOME; if (!operatorHome) throw new Error("R033_V5_OPERATOR_HOME_REQUIRED");
const deniedRoot = await realpath(await mkdtemp(join(tmpdir(), "r033-v5-denied-")));
const esc = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
const profile = `(version 1)\n(deny default)\n(allow process*)\n(allow sysctl-read)\n(allow file-read-metadata)\n(allow file-read* (require-not (subpath "${esc(operatorHome)}")))\n(allow file-read* (literal "${esc(bun)}") (subpath "${esc(repo)}") (subpath "${esc(root)}"))\n(allow file-write* (subpath "${esc(root)}"))`;
const rawPath = join(root, "raw.json"), configPath = join(root, "config.json");
await Bun.write(configPath, JSON.stringify({ outputPath: rawPath, operatorHomeProbe: join(operatorHome, ".zshrc"), keychainProbe: join(operatorHome, "Library/Keychains/login.keychain-db"), outsideWrite: join(deniedRoot, "denied") }));
const env = { HOME: home, LANG: "C.UTF-8", LC_ALL: "C.UTF-8", NO_COLOR: "1", PATH: "/usr/bin:/bin", TMPDIR: temp };
const child = Bun.spawn([sandbox, "-p", profile, bun, resolve(import.meta.dir, "collector-child.ts"), configPath], { cwd: work, env, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
if (exit) throw new Error(`R033_V5_CHILD_FAILED_${sha256(stderr)}`);
const raw = await readFile(rawPath, "utf8"); if (detectSentinel(raw, SENTINEL_FORMS).length) throw new Error("R033_V5_PARENT_SECRET_CONTROL");
const parsed = JSON.parse(raw); if (!Array.isArray(parsed.results) || parsed.results.length !== 70) throw new Error("R033_V5_PARENT_MATRIX_CARDINALITY");
for (const result of parsed.results) { const { checksum, ...payload } = result; if (checksum !== sha256(JSON.stringify(payload))) throw new Error("R033_V5_RESULT_CHECKSUM"); }
const freezeBytes = await readFile(resolve(import.meta.dir, "precollection-freeze.json")); const freeze = JSON.parse(freezeBytes.toString());
const sourceSha256 = freeze.sourceSha256, dependencySha256 = freeze.dependencySha256;
const revision = new TextDecoder().decode(Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: repo }).stdout).trim();
const containmentDigest = sha256(JSON.stringify(parsed.containment));
const executionDigest = sha256(JSON.stringify(parsed.results));
const provenance = { revision, platform: platform(), release: release(), arch: arch(), bun: Bun.version, git: new TextDecoder().decode(Bun.spawnSync(["git", "--version"]).stdout).trim(), freezeManifestSha256: sha256(freezeBytes), reviewSha256: sha256(await readFile(reviewPath)), sourceSha256, dependencySha256, instrumentSha256: await currentInstrumentHashes(), fixturePlanSha256: fixturePlanDigest(), sandboxProfileSha256: sha256(profile), environmentKeys: Object.keys(env).sort(), stdoutSha256: sha256(stdout), stderrSha256: sha256(stderr), containmentDigest, executionDigest };
await mkdir(outputRoot, { recursive: true });
await Bun.write(join(outputRoot, "results.json"), JSON.stringify({ schemaVersion: "5.2", results: parsed.results }, null, 2) + "\n");
await Bun.write(join(outputRoot, "containment.json"), JSON.stringify(parsed.containment, null, 2) + "\n");
await Bun.write(join(outputRoot, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n");
const controls = { schemaVersion: "5.2", matrixRows: parsed.results.length, cellCounts: Object.fromEntries(Array.from({ length: 14 }, (_, index) => { const cell = `CC-${String(index + 1).padStart(2, "0")}`; return [cell, parsed.results.filter((row: any) => row.cell === cell).length]; })), candidateCounts: Object.fromEntries(Array.from({ length: 5 }, (_, index) => { const candidate = `CAND-${String(index + 1).padStart(2, "0")}`; return [candidate, parsed.results.filter((row: any) => row.candidate === candidate).length]; })), containmentDigest, executionDigest, postCollectionReviewRequired: true };
await Bun.write(join(outputRoot, "cross-candidate-controls.json"), JSON.stringify(controls, null, 2) + "\n");
await Bun.write(join(outputRoot, "README.md"), "# R-033 V5 collected carrier\n\nGenerated only after exact pre-collection approval. Candidate results remain pending independent post-collection review and cannot enter synthesis.\n");
const names = ["results.json", "containment.json", "provenance.json", "cross-candidate-controls.json", "README.md"];
const sums = await Promise.all(names.map(async name => `${createHash("sha256").update(await readFile(join(outputRoot, name))).digest("hex")}  ${name}`));
await Bun.write(join(outputRoot, "SHA256SUMS"), sums.join("\n") + "\n");
