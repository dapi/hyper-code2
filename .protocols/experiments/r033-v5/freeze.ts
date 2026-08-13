import { arch, platform, release } from "node:os";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { FIXTURE_PLAN, fixturePlanDigest, sha256 } from "./fixtures";
import { currentInstrumentHashes } from "./instrument";

const repo = resolve(import.meta.dir, "../../..");
const sourcePaths = ["memory-bank/engineering/security-boundary.md", "src/llm/resolveEndpoint.ts", "src/llm/streamOpenAI.ts", "src/llm/streamAnthropic.ts", "src/llm/streamCodex.ts", "src/agent/llmCall.ts", "src/agent/buildLlmRequest.ts", "src/agent/executeMarker.ts", "src/agent/executeBash.ts", "src/agent/formatMarkerResult.ts", "src/agent/formatMarkerError.ts", "src/llm/refreshKimiCode.ts", "src/llm/refreshClaudeCode.ts", "src/llm/refreshCodex.ts", "src/llm/listModels.ts", "src/agent/$route_new_GET.ts", "src/$main.ts", "src/$type_Context.ts", "src/loadFns.ts", "src/genTypes.ts", "src/ctx_ns.d.ts", "src/repl/eval.ts", "src/settings/get.ts", "src/settings/getString.ts", "src/settings/list.ts", "src/db/select.ts", "src/files/read.ts", "src/session/appendMessage.ts", "src/session/appendEvent.ts", "src/session/appendEventWithHtml.ts", "src/session/appendUserMessage.ts", "src/session/appendAssistantMessage.ts", "src/session/appendErrorEvent.ts", "src/session/updateScratchpad.ts", "src/session/save.ts", "src/agent/renderEventHtml.ts"];
const dependencyPaths = [".protocols/experiments/r018-sentinel-lib.ts"];
const hashes = async (paths: string[]) => Object.fromEntries(await Promise.all(paths.map(async path => [path, sha256(await readFile(resolve(repo, path)))])));
const manifest = {
  schemaVersion: "5.2", status: "frozen-awaiting-independent-precollection-review", collectionAuthorized: false, candidateResultsCollected: false,
  supersedesRejectedFreezeSha256: "0ddad70a481eeb28e1cebfd6265991f1ea7ebf2d22a489593d4e751c0bc9129e",
  rejectedDiagnosticCarrier: ".protocols/experiments/runs/R-033/v5-collection-2026-08-13-cac11c9e",
  head: new TextDecoder().decode(Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: repo }).stdout).trim(),
  environment: { platform: platform(), release: release(), arch: arch(), bun: Bun.version, git: new TextDecoder().decode(Bun.spawnSync(["git", "--version"]).stdout).trim() },
  fixturePlanSha256: fixturePlanDigest(), instrumentSha256: await currentInstrumentHashes(), dependencySha256: await hashes(dependencyPaths), sourceSha256: await hashes(sourcePaths), childEnvironmentKeys: ["HOME", "LANG", "LC_ALL", "NO_COLOR", "PATH", "TMPDIR"],
  frozenExecution: { candidates: 5, cells: 14, matrixRows: 70, rotatingOrders: FIXTURE_PLAN.rotatingOrders, refreshFailureStages: FIXTURE_PLAN.refreshFailureStages, stableCarrierRequiresPostCollectionReview: true },
};
await Bun.write(resolve(import.meta.dir, "precollection-freeze.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(sha256(await readFile(resolve(import.meta.dir, "precollection-freeze.json"))));
