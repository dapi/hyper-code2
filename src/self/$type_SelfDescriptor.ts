export type EpistemicStatus = 'observed' | 'inferred' | 'unavailable';
export type Freshness = 'fresh' | 'stale' | 'unavailable';

export type SelfDescriptor = {
    schemaVersion: 1;
    generatedAt: string;
    capabilities: Array<Record<string, unknown>>;
    prompts: { valuesIncluded: false; layers: Array<Record<string, unknown>> };
    state: { valuesIncluded: false; categories: Array<Record<string, unknown>> };
    authority: {
        valuesIncluded: false;
        mutationAddedByDescriptor: false;
        categories: Array<Record<string, unknown>>;
    };
};
