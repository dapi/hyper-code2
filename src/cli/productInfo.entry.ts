export const PRODUCT_NAME = 'hyper-code2';

export async function packageVersion(): Promise<string> {
    const pkg = await Bun.file(
        new URL('../../package.json', import.meta.url),
    ).json();
    return String(pkg.version ?? '0.0.0-dev');
}

export function productLabel(version: string): string {
    return `${PRODUCT_NAME} v${version}`;
}
