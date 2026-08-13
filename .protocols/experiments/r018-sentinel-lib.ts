export const SENTINEL = "R018-NONSECRET-e\u0301:'%/+/\u{10FFFF}";

export type SentinelForm = {
    id: `S${number}`;
    label: string;
    values: string[];
};

function shellSingleQuote(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function sentinelForms(value = SENTINEL): SentinelForm[] {
    const jsonQuoted = JSON.stringify(value);
    const bytes = Buffer.from(value, 'utf8');
    const raw: SentinelForm[] = [
        { id: 'S0', label: 'raw UTF-8', values: [value] },
        // The unquoted JSON content is byte-identical to S0 for this fixture,
        // so retain only the distinct quoted representation.
        { id: 'S1', label: 'JSON escaped', values: [jsonQuoted] },
        { id: 'S2', label: 'URL encoded', values: [encodeURIComponent(value).replace(/%[0-9a-f]{2}/gi, x => x.toUpperCase())] },
        { id: 'S3', label: 'standard Base64', values: [bytes.toString('base64')] },
        { id: 'S4', label: 'Base64url', values: [bytes.toString('base64url')] },
        { id: 'S5', label: 'lowercase hexadecimal', values: [bytes.toString('hex')] },
        { id: 'S6', label: 'uppercase hexadecimal', values: [bytes.toString('hex').toUpperCase()] },
        { id: 'S7', label: 'shell single-quote form', values: [shellSingleQuote(value)] },
        { id: 'S8', label: 'NFC-normalized text', values: [value.normalize('NFC')] },
    ];

    return raw.map(form => ({
        ...form,
        values: [...new Set(form.values)].filter(candidate => candidate !== ''),
    }));
}

export type SentinelHit = {
    formId: string;
    valueIndex: number;
    offset: number;
};

export function detectSentinel(text: string, forms = sentinelForms()): SentinelHit[] {
    const hits: SentinelHit[] = [];
    for (const form of forms) {
        form.values.forEach((value, valueIndex) => {
            let offset = text.indexOf(value);
            while (offset >= 0) {
                hits.push({ formId: form.id, valueIndex, offset });
                offset = text.indexOf(value, offset + value.length);
            }
        });
    }
    return hits;
}

export function sha256(value: string): string {
    return new Bun.CryptoHasher('sha256').update(value).digest('hex');
}
