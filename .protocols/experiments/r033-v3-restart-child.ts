import { readFile } from 'node:fs/promises';

import { SENTINEL } from './r033-v3-semantics';

type Config = { inputPath: string; outputPath: string };
const config = await Bun.file(process.argv[2]).json() as Config;
const input = JSON.parse(await readFile(config.inputPath, 'utf8')) as { candidate: string; state: Record<string, unknown> };
const hasRaw = JSON.stringify(input.state).includes(SENTINEL);
const hasReference = input.state.credentialRef === 'credref:provider/account/fixture';
const revalidationRequired = input.state.revalidate === true;
await Bun.write(config.outputPath, JSON.stringify({
    candidate: input.candidate,
    newProcess: true,
    rawRecovered: hasRaw,
    referenceRecovered: hasReference,
    revalidationRequired,
    status: !hasRaw && hasReference && revalidationRequired ? 'pass' : 'fail',
}));
