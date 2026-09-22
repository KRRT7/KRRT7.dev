import {
    buildBehaviorBundle,
    buildDeferredBehaviorBundle,
    bunSiteOutDir,
    faviconSvg,
    htmlCacheControl,
    immutableAssetCacheControl,
    ogSvg,
    prepareStaticAssets,
    renderHomeHtml,
    robotsTxt,
    sitemapXml,
} from "@/site/static-output";

const port = Number(Bun.env.PORT ?? 3000);

const paths = await prepareStaticAssets(bunSiteOutDir);
const avatarBytes = await Bun.file(paths.avatarPath).bytes();
const avatarAvifBytes = await Bun.file(paths.avatarAvifPath).bytes();
const avatarWebpBytes = await Bun.file(paths.avatarWebpPath).bytes();

const server = Bun.serve({
    port,
    routes: {
        "/": async () => html(await renderHomeHtml({
            avatarAvifSrc: "/assets/avatar.avif",
            avatarWebpSrc: "/assets/avatar.webp",
        })),
        "/site-behavior.js": async () => javascript(await buildBehaviorBundle()),
        "/site-behavior-deferred.js": async () => javascript(await buildDeferredBehaviorBundle()),
        "/assets/site.css": () => file(paths.cssPath, "text/css; charset=utf-8", "no-cache"),
        "/assets/avatar.jpg": new Response(avatarBytes, {
            headers: headers("image/jpeg", immutableAssetCacheControl),
        }),
        "/assets/avatar.avif": new Response(avatarAvifBytes, {
            headers: headers("image/avif", immutableAssetCacheControl),
        }),
        "/assets/avatar.webp": new Response(avatarWebpBytes, {
            headers: headers("image/webp", immutableAssetCacheControl),
        }),
        "/favicon.svg": svg(faviconSvg, immutableAssetCacheControl),
        "/og.svg": svg(ogSvg, "public, max-age=3600"),
        "/robots.txt": text(robotsTxt(), "text/plain; charset=utf-8"),
        "/sitemap.xml": text(sitemapXml(), "application/xml; charset=utf-8"),
    },
    fetch() {
        return new Response("Not found", { status: 404 });
    },
});

console.log(`Bun server listening on http://localhost:${server.port}`);

function html(body: string) {
    return text(body, "text/html; charset=utf-8");
}

function javascript(body: string) {
    return text(body, "text/javascript; charset=utf-8", "no-cache");
}

function svg(body: string, cacheControl: string) {
    return text(body, "image/svg+xml", cacheControl);
}

function text(body: string, contentType: string, cacheControl = htmlCacheControl) {
    return new Response(body, {
        headers: headers(contentType, cacheControl),
    });
}

function file(path: string, contentType: string, cacheControl: string) {
    return new Response(Bun.file(path), {
        headers: headers(contentType, cacheControl),
    });
}

function headers(contentType: string, cacheControl: string) {
    return {
        "Cache-Control": cacheControl,
        "Content-Type": contentType,
    };
}
