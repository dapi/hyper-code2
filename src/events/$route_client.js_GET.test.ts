import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import clientRoute from './$route_client.js_GET';

const originalCwd = process.cwd();
const externalWorkspace = join(originalCwd, '.test-tmp', `events-route-${process.pid}-${Date.now()}`);

afterEach(async () => {
    process.chdir(originalCwd);
    await rm(externalWorkspace, { recursive: true, force: true });
});

describe('GET /events/client.js', () => {
    test('serves the shipped client asset when the runtime cwd is an external workspace', async () => {
        await mkdir(externalWorkspace, { recursive: true });
        process.chdir(externalWorkspace);

        const response = await clientRoute();

        expect(response.headers.get('content-type')).toBe('application/javascript; charset=utf-8');
        expect(await response.text()).toContain("new EventSource('/events')");
    });
});
