// Reserved lifecycle hook for REPL startup. Keeping it as a procedure makes
// the scanner contract explicit even though the current runtime needs no
// initialization work here.
export default async function (_ctx: Context): Promise<void> {}
