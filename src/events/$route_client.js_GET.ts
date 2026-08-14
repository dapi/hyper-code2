const clientAsset = new URL('./client.js', import.meta.url);

export default async function () {
    return new Response(await Bun.file(clientAsset).text(), { headers: { 'content-type': 'application/javascript; charset=utf-8' } });
}
