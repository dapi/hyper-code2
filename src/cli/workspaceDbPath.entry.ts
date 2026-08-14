import { join } from 'node:path';

// hcode deliberately does not inherit DB_PATH: each selected workspace owns
// its terminal state. The legacy browser entrypoint keeps its compatibility
// override in startRuntime by simply not passing this explicit path.
export function workspaceSessionDbPath(workspace: string): string {
    return join(workspace, '.hyper', '_runtime', 'sessions');
}
