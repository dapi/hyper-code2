import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import loadFns from "../../src/loadFns.ts";

type Config = { brokerDir: string; workspace: string; mode: "mock" | "live"; authHome?: string };
const config = await Bun.file(process.argv[2]!).json() as Config;
await mkdir(config.brokerDir, { recursive: true });
process.chdir(config.workspace);

const mockReplies: Record<string, string[]> = {
  baseline: [
    '§eval\nconst input = [" Priority ", "priority", "Customer Success", "customer-success", "R&D"]; const out = []; for (const value of input) { const tag = await ctx.fns.text.normalizeTag(ctx, { value }); if (!out.includes(tag)) out.push(tag); } console.log(JSON.stringify(out));',
    '["priority","customer-success","r-d"]',
  ],
  retain: [
    '§write:.hyper/text/dedupeTags.ts\nexport default async function (ctx: Context, opts: { values: string[] }) {\n  const tags: string[] = [];\n  for (const value of opts.values) {\n    const tag = await ctx.fns.text.normalizeTag(ctx, { value });\n    if (!tags.includes(tag)) tags.push(tag);\n  }\n  return tags;\n}',
    '§eval\nawait ctx.fns.repl.load(ctx, { name: "text" }); console.log(JSON.stringify(await ctx.fns.text.dedupeTags(ctx, { values: [" A ", "a", "B B"] })));',
    '["a","b-b"]',
  ],
  reuse: [
    '§eval\nconst tags = await ctx.fns.text.dedupeTags(ctx, { values: ["Enterprise", " enterprise ", "Customer Success", "customer-success"] }); console.log(JSON.stringify({ tags, csv: tags.join(","), count: tags.length }));',
    '{"tags":["enterprise","customer-success"],"csv":"enterprise,customer-success","count":2}',
  ],
};

let ctx: any = null;
if (config.mode === "live") {
  ctx = { env: { HOME: config.authHome, PATH: process.env.PATH }, state: {}, routes: {}, fns: {} };
  await loadFns(ctx);
}
const handled = new Set<string>();
while (!(await Bun.file(join(config.brokerDir, "STOP")).exists())) {
  const names = (await readdir(config.brokerDir)).filter((name) => name.endsWith(".request.json")).sort();
  for (const name of names) {
    if (handled.has(name)) continue;
    handled.add(name);
    const requestPath = join(config.brokerDir, name);
    const responsePath = requestPath.replace(/\.request\.json$/, ".response.json");
    try {
      const request = await Bun.file(requestPath).json();
      let result: any;
      if (config.mode === "mock") {
        const text = mockReplies[request.phase]?.[request.sequence - 1];
        if (text == null) throw new Error(`mock broker queue exhausted: ${request.phase}/${request.sequence}`);
        result = { text, thinking: "", finishReason: "stop", usage: { prompt_tokens: request.sequence, total_tokens: request.sequence + 1 } };
      } else {
        result = await ctx.fns.llm.stream(ctx, { agent: request.agent });
      }
      await Bun.write(responsePath, JSON.stringify({ ok: true, result }));
    } catch (cause: any) {
      await Bun.write(responsePath, JSON.stringify({ ok: false, error: cause?.message ?? String(cause) }));
    }
  }
  await Bun.sleep(15);
}
