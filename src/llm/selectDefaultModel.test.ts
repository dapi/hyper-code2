import { describe, expect, test } from 'bun:test';
import selectDefaultModel from './selectDefaultModel';

function ctx(opts: {
    model?: string;
    saved?: string;
    groups?: Record<string, string[]>;
    keys?: Record<string, string | undefined>;
} = {}) {
    return {
        env: opts.model ? { MODEL: opts.model } : {},
        fns: {
            db: {
                select: () => opts.saved ? [{ value: JSON.stringify(opts.saved) }] : [],
            },
            llm: {
                listModels: async () => opts.groups ?? {},
            },
            settings: {
                getString: (_ctx: unknown, setting: { key: string }) => opts.keys?.[setting.key],
            },
        },
    } as any as Context;
}

describe('llm.selectDefaultModel', () => {
    test('keeps explicit and environment choices transient', async () => {
        const context = ctx({ model: 'openai:from-env', saved: 'codex:saved' });
        expect(await selectDefaultModel(context, { explicitModel: 'mock:explicit' }))
            .toEqual({ model: 'mock:explicit', detected: false, alternatives: [] });
        expect(await selectDefaultModel(context))
            .toEqual({ model: 'openai:from-env', detected: false, alternatives: [] });
    });

    test('uses a previously verified default before detecting again', async () => {
        expect(await selectDefaultModel(ctx({ saved: 'codex:gpt-5' })))
            .toEqual({ model: 'codex:gpt-5', detected: false, alternatives: [] });
    });

    test('prioritizes subscriptions, then local models, then configured API providers', async () => {
        const result = await selectDefaultModel(ctx({
            groups: {
                codex: ['codex:subscription'],
                'kimi-coding': ['kimi-coding:subscription'],
                lmstudio: ['local-model'],
                openai: ['openai:api'],
                anthropic: ['anthropic:api'],
            },
            keys: { openaiApiKey: 'key', anthropicApiKey: 'key' },
        }));

        expect(result).toEqual({
            model: 'codex:subscription',
            detected: true,
            alternatives: [
                'kimi-coding:subscription',
                'lmstudio:local-model',
                'openai:api',
                'anthropic:api',
            ],
        });
    });

    test('fails clearly when no subscription, local model, or credential is available', async () => {
        await expect(selectDefaultModel(ctx({ groups: { openai: ['openai:api'] } })))
            .rejects.toThrow('No configured model is available');
    });
});
