import { loadUc005Fns } from "./uc005-v2-bootstrap.ts";
import { sanitizeJson } from "./uc005-v2-lib.ts";

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: bun uc005-v2-restart.ts <config.json>");
const config = await Bun.file(configPath).json() as { repoRoot: string; runRoot: string; workspace: string; outputPath: string; sentinel: string };
process.chdir(config.workspace);
const ctx: any = { env: {}, state: {}, routes: {}, fns: {} };
await loadUc005Fns(ctx, config);
await ctx.fns.repl.load(ctx, { name: "text" });
const callable = typeof ctx.fns.text?.dedupeTags === "function";
const value = callable ? await ctx.fns.text.dedupeTags(ctx, { values: [" Restart ", "restart", "Fresh Process"] }) : null;
await Bun.write(config.outputPath, JSON.stringify(sanitizeJson({
  schemaVersion: 2,
  pid: process.pid,
  callable,
  value,
}, [config.runRoot, config.workspace, config.sentinel]), null, 2));
