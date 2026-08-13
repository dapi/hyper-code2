export default async function (ctx: Context, opts: { values: string[] }) {
  const tags: string[] = [];
  for (const value of opts.values) {
    const tag = await ctx.fns.text.normalizeTag(ctx, { value });
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}