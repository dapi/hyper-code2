import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type VariantId = "V0" | "V1" | "V2" | "V3";
export type FamilyId = "tag-normalization" | "repository-evidence" | "saved-json-transform";

export type CapabilitySpec = {
    name: string;
    family: FamilyId;
    source: string;
    signature: string;
    inputFields: string[];
};

export type InvocationTrace = {
    variant: VariantId;
    invocationPath: "ordinary-direct" | "descriptor-adapter";
    descriptorResolved: boolean;
    adapterBoundaryCrossed: boolean;
    source: string;
};

export const contractVersion = "R-031.discovery-retention.v1";
export const variants: VariantId[] = ["V0", "V1", "V2", "V3"];
export const capabilities: CapabilitySpec[] = [
    {
        name: "normalizeTags",
        family: "tag-normalization",
        source: "capabilities/normalizeTags.mjs",
        signature: "(ctx, { tags }: { tags: string[] }) => Promise<string[]>",
        inputFields: ["tags"],
    },
    {
        name: "extractRepositoryEvidence",
        family: "repository-evidence",
        source: "capabilities/extractRepositoryEvidence.mjs",
        signature: "(ctx, { lines }: { lines: string[] }) => Promise<string[]>",
        inputFields: ["lines"],
    },
    {
        name: "transformSavedJson",
        family: "saved-json-transform",
        source: "capabilities/transformSavedJson.mjs",
        signature: "(ctx, { records }: { records: Array<{ id: string; enabled: boolean }> }) => Promise<Record<string, boolean>>",
        inputFields: ["records"],
    },
];

export const fixtures: Record<FamilyId, { input: unknown; invalidInput: unknown; golden: unknown }> = {
    "tag-normalization": {
        input: { tags: [" Alpha ", "beta", "ALPHA", "release candidate"] },
        invalidInput: { tags: [] },
        golden: ["alpha", "beta", "release-candidate"],
    },
    "repository-evidence": {
        input: { lines: ["note", "EVIDENCE: tests pass", " EVIDENCE: checksums match ", "noise"] },
        invalidInput: { lines: [] },
        golden: ["tests pass", "checksums match"],
    },
    "saved-json-transform": {
        input: { records: [{ id: "alpha", enabled: true }, { id: "beta", enabled: false }] },
        invalidInput: { records: [] },
        golden: { alpha: true, beta: false },
    },
};

const sources: Record<FamilyId, string> = {
    "tag-normalization": `/** @capability normalizeTags\n * @family tag-normalization\n * @signature (ctx, { tags }: { tags: string[] }) => Promise<string[]>\n */\nexport default async function (_ctx, { tags }) {\n  return [...new Set(tags.map(value => value.trim().toLowerCase().replace(/\\s+/g, "-")).filter(Boolean))].sort();\n}\n`,
    "repository-evidence": `/** @capability extractRepositoryEvidence\n * @family repository-evidence\n * @signature (ctx, { lines }: { lines: string[] }) => Promise<string[]>\n */\nexport default async function (_ctx, { lines }) {\n  return lines.map(value => value.trim()).filter(value => value.startsWith("EVIDENCE:")).map(value => value.slice(9).trim());\n}\n`,
    "saved-json-transform": `/** @capability transformSavedJson\n * @family saved-json-transform\n * @signature (ctx, { records }: { records: Array<{ id: string; enabled: boolean }> }) => Promise<Record<string, boolean>>\n */\nexport default async function (_ctx, { records }) {\n  return Object.fromEntries(records.map(record => [record.id, record.enabled]));\n}\n`,
};

export const compositionSource = `/** @capability inspectComposedResult\n * @signature (ctx, { value }: { value: unknown }) => Promise<{ json: string }>\n */\nexport default async function (_ctx, { value }) {\n  return { json: JSON.stringify(value) };\n}\n`;

export function sha256(value: string | Uint8Array) {
    return createHash("sha256").update(value).digest("hex");
}

export function stableJson(value: unknown) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

export async function writeSubstrate(root: string) {
    const directory = join(root, "capabilities");
    await mkdir(directory, { recursive: true });
    for (const capability of capabilities) {
        await writeFile(join(root, capability.source), sources[capability.family]);
    }
    await writeFile(join(directory, "inspectComposedResult.mjs"), compositionSource);
}

export async function writeProjection(root: string, variant: VariantId) {
    const directory = join(root, "projections", variant);
    await mkdir(directory, { recursive: true });
    if (variant === "V0") {
        await writeFile(join(directory, "retention-instructions.json"), stableJson({
            contractVersion,
            contract: "ordinary-callables-explicit-retention",
            searchRoot: "capabilities",
            discovery: "Inspect ordinary callable source annotations and signatures before creating a duplicate.",
            invocation: "direct",
        }));
    } else if (variant === "V1") {
        await writeFile(join(directory, "capability-manifest.json"), stableJson({
            contractVersion,
            contract: "read-only-capability-manifest",
            invocation: "direct",
            capabilities,
        }));
    } else if (variant === "V2") {
        const declarations = capabilities.map(item => [
            `/** @family ${item.family}`,
            ` * @source ${item.source}`,
            " */",
            `declare function ${item.name}${item.signature};`,
        ].join("\n")).join("\n\n");
        await writeFile(join(directory, "capabilities.d.ts"), `// contract: ${contractVersion}\n${declarations}\n`);
    } else {
        await writeFile(join(directory, "descriptors.json"), stableJson({
            contractVersion,
            contract: "descriptor-mediated-prototype",
            invocation: "descriptor-adapter",
            descriptors: capabilities.map(item => ({
                name: item.name,
                family: item.family,
                source: item.source,
                signature: item.signature,
                inputFields: item.inputFields,
                invokeKey: item.name,
            })),
        }));
    }
}

export async function discover(root: string, variant: VariantId, family: FamilyId): Promise<CapabilitySpec> {
    if (variant === "V0") {
        const instructions = JSON.parse(await readFile(join(root, "projections/V0/retention-instructions.json"), "utf8"));
        assert.equal(instructions.contractVersion, contractVersion);
        assert.equal(instructions.invocation, "direct");
        const directory = join(root, "capabilities");
        for (const file of (await readdir(directory)).sort()) {
            const source = await readFile(join(directory, file), "utf8");
            const capability = source.match(/@capability\s+([^\s]+)/)?.[1];
            const foundFamily = source.match(/@family\s+([^\s]+)/)?.[1];
            const signature = source.match(/@signature\s+([^\n]+)/)?.[1]?.trim();
            if (foundFamily === family && capability && signature) {
                const spec = capabilities.find(item => item.name === capability);
                assert(spec, `V0 unknown capability ${capability}`);
                assert.equal(signature, spec.signature);
                return spec;
            }
        }
    } else if (variant === "V1") {
        const manifest = JSON.parse(await readFile(join(root, "projections/V1/capability-manifest.json"), "utf8"));
        assert.equal(manifest.contractVersion, contractVersion);
        const found = manifest.capabilities.find((item: CapabilitySpec) => item.family === family);
        if (found) return found;
    } else if (variant === "V2") {
        const declaration = await readFile(join(root, "projections/V2/capabilities.d.ts"), "utf8");
        assert(declaration.includes(`contract: ${contractVersion}`));
        const blocks = declaration.split("\n\n");
        const block = blocks.find(value => value.includes(`@family ${family}`));
        if (block) {
            const name = block.match(/declare function\s+([^\s(]+)/)?.[1];
            const source = block.match(/@source\s+([^\s]+)/)?.[1];
            const spec = capabilities.find(item => item.name === name);
            assert(spec && source === spec.source, `V2 malformed declaration for ${family}`);
            return spec;
        }
    } else {
        const catalog = JSON.parse(await readFile(join(root, "projections/V3/descriptors.json"), "utf8"));
        assert.equal(catalog.contractVersion, contractVersion);
        const found = catalog.descriptors.find((item: CapabilitySpec) => item.family === family);
        if (found) return found;
    }
    throw new Error(`${variant} did not discover ${family}`);
}

async function invokeOrdinary(root: string, capability: CapabilitySpec, input: unknown) {
    const module = await import(`${Bun.pathToFileURL(join(root, capability.source)).href}?fresh=${crypto.randomUUID()}`);
    assert.equal(typeof module.default, "function");
    return module.default({}, input);
}

async function invokeThroughDescriptorAdapter(root: string, invokeKey: string, input: unknown) {
    const catalog = JSON.parse(await readFile(join(root, "projections/V3/descriptors.json"), "utf8"));
    assert.equal(catalog.contractVersion, contractVersion);
    assert.equal(catalog.invocation, "descriptor-adapter");
    const descriptor = catalog.descriptors.find((item: any) => item.invokeKey === invokeKey);
    assert(descriptor, `V3 descriptor adapter cannot resolve ${invokeKey}`);
    const admitted = capabilities.find(item => item.name === descriptor.name);
    assert(admitted, `V3 descriptor adapter rejected unadmitted callable ${descriptor.name}`);
    assert.equal(descriptor.source, admitted.source);
    assert.equal(descriptor.signature, admitted.signature);
    const result = await invokeOrdinary(root, admitted, input);
    return {
        result,
        trace: {
            variant: "V3",
            invocationPath: "descriptor-adapter",
            descriptorResolved: true,
            adapterBoundaryCrossed: true,
            source: admitted.source,
        } satisfies InvocationTrace,
    };
}

export async function invokeObserved(root: string, variant: VariantId, capability: CapabilitySpec, input: unknown) {
    if (variant === "V3") return invokeThroughDescriptorAdapter(root, capability.name, input);
    return {
        result: await invokeOrdinary(root, capability, input),
        trace: {
            variant,
            invocationPath: "ordinary-direct",
            descriptorResolved: false,
            adapterBoundaryCrossed: false,
            source: capability.source,
        } satisfies InvocationTrace,
    };
}

export async function invoke(root: string, variant: VariantId, capability: CapabilitySpec, input: unknown) {
    return (await invokeObserved(root, variant, capability, input)).result;
}

export async function projectionDigest(root: string, variant: VariantId) {
    const directory = join(root, "projections", variant);
    const files = (await readdir(directory)).sort();
    const contents = await Promise.all(files.map(file => readFile(join(directory, file), "utf8")));
    return sha256(files.map((file, index) => `${file}:${sha256(contents[index]!)}`).join("\n"));
}
