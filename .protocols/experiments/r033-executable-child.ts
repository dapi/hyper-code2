import { CANDIDATES, CELLS, executeCell } from './r033-executable-adapters';

type Config = { outputPath: string };
const configPath = process.argv[2];
if (!configPath) throw new Error('usage: bun r033-executable-child.ts <config.json>');
const config = await Bun.file(configPath).json() as Config;

const ordered = CELLS.flatMap((cell, index) =>
    CANDIDATES.map((_, offset) => CANDIDATES[(index + offset) % CANDIDATES.length]).map(candidate => ({ candidate, cell })),
);
const results = ordered.map(({ candidate, cell }) => executeCell(candidate, cell));
const injectedLeakControls = ordered.map(({ candidate, cell }) => executeCell(candidate, cell, true));
await Bun.write(config.outputPath, JSON.stringify({ schemaVersion: 1, results, injectedLeakControls }));
