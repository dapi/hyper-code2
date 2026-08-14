import { realpath, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

export default async function resolveWorkspace(path = process.cwd()): Promise<string> {
    const requested = resolve(path);
    let canonical: string;
    try {
        canonical = await realpath(requested);
    } catch {
        throw new Error(`workspace does not exist: ${requested}`);
    }
    const info = await stat(canonical);
    if (!info.isDirectory()) throw new Error(`workspace is not a directory: ${canonical}`);
    return canonical;
}
