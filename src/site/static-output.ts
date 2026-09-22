import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { serializeContributionData } from "@/app/_components/contributions";
import { buildHomepageContext, type HomepageContext } from "@/lib/homepage-context";
import { fetchSiteData } from "@/lib/site-data";
import { faviconSvg, ogSvg } from "@/site/assets";
import { criticalCss } from "@/site/critical-css";
import { SiteDocument } from "@/site/document";
import { HomePage } from "@/site/home";
import {
    absoluteSiteUrl,
    siteDescription,
    siteSocialDescription,
    siteThemeColor,
    siteTitle,
} from "@/site/metadata";

export const siteRoot = import.meta.dir.replace(/\/src\/site$/, "");
export const bunSiteOutDir = join(siteRoot, ".cache", "bun-site");
export const pagesOutDir = join(siteRoot, ".cache", "pages");
export const htmlCacheControl = "public, max-age=60, stale-while-revalidate=86400";
export const immutableAssetCacheControl = "public, max-age=31536000, immutable";
export { faviconSvg, ogSvg };

const avatarSource = join(siteRoot, "src", "app", "_assets", "avatar.jpg");
const avatarAvifSource = join(siteRoot, "src", "app", "_assets", "avatar.avif");
const avatarWebpSource = join(siteRoot, "src", "app", "_assets", "avatar.webp");
let cachedBehaviorBundle: string | null = null;
let cachedDeferredBehaviorBundle: string | null = null;

export function assetPaths(outDir: string) {
    const assetsDir = join(outDir, "assets");

    return {
        assetsDir,
        cssPath: join(assetsDir, "site.css"),
        avatarPath: join(assetsDir, "avatar.jpg"),
        avatarAvifPath: join(assetsDir, "avatar.avif"),
        avatarWebpPath: join(assetsDir, "avatar.webp"),
        behaviorPath: join(outDir, "site-behavior.js"),
        deferredBehaviorPath: join(outDir, "site-behavior-deferred.js"),
    };
}

export async function prepareStaticAssets(outDir: string, options: { clean?: boolean } = {}) {
    if (options.clean) await rm(outDir, { recursive: true, force: true });

    const paths = assetPaths(outDir);
    await mkdir(paths.assetsDir, { recursive: true });
    await copyFile(avatarSource, paths.avatarPath);
    await copyFile(avatarAvifSource, paths.avatarAvifPath);
    await copyFile(avatarWebpSource, paths.avatarWebpPath);
    await writeFile(paths.deferredBehaviorPath, await buildDeferredBehaviorBundle());
    await writeFile(paths.behaviorPath, await buildBehaviorBundle("/site-behavior-deferred.js"));
    await run(join(siteRoot, "node_modules", ".bin", "tailwindcss"), [
        "-c",
        join(siteRoot, "src", "tailwind.config.ts"),
        "-i",
        join(siteRoot, "src", "app", "globals.css"),
        "-o",
        paths.cssPath,
        "--minify",
    ]);

    return paths;
}

export async function writePagesStaticSite(outDir = pagesOutDir) {
    const paths = await prepareStaticAssets(outDir, { clean: true });
    const css = await readFile(paths.cssPath, "utf8");
    const behavior = await readFile(paths.behaviorPath, "utf8");
    const deferredBehavior = await readFile(paths.deferredBehaviorPath, "utf8");
    const avatar = await readFile(paths.avatarPath);
    const avatarAvif = await readFile(paths.avatarAvifPath);
    const avatarWebp = await readFile(paths.avatarWebpPath);
    const context = await homepageContext();
    const contributionData = serializeContributionData(context.contributions.allPullRequests);
    const deferredScriptSrc = `/assets/site-behavior-deferred.${contentHash(deferredBehavior)}.js`;
    const staticBehavior = await buildBehaviorBundle(deferredScriptSrc);
    const scriptSrc = `/assets/site-behavior.${contentHash(staticBehavior)}.js`;
    const stylesheetSrc = `/assets/site.${contentHash(css)}.css`;
    const avatarSrc = `/assets/avatar.${contentHash(avatar)}.jpg`;
    const avatarAvifSrc = `/assets/avatar.${contentHash(avatarAvif)}.avif`;
    const avatarWebpSrc = `/assets/avatar.${contentHash(avatarWebp)}.webp`;
    const contributionDataSrc = `/assets/contributions.${contentHash(contributionData)}.json`;

    await writeFile(join(outDir, scriptSrc), staticBehavior);
    await writeFile(join(outDir, deferredScriptSrc), deferredBehavior);
    await writeFile(join(outDir, stylesheetSrc), css);
    await writeFile(join(outDir, avatarSrc), avatar);
    await writeFile(join(outDir, avatarAvifSrc), avatarAvif);
    await writeFile(join(outDir, avatarWebpSrc), avatarWebp);
    await writeFile(join(outDir, contributionDataSrc), contributionData);
    await rm(paths.behaviorPath, { force: true });
    await rm(paths.deferredBehaviorPath, { force: true });
    await rm(paths.avatarPath, { force: true });
    await rm(paths.avatarAvifPath, { force: true });
    await rm(paths.avatarWebpPath, { force: true });
    await rm(paths.cssPath, { force: true });
    await writeFile(
        join(outDir, "index.html"),
        await renderHomeHtml({ avatarSrc, avatarAvifSrc, avatarWebpSrc, contributionDataSrc, context, stylesheetSrc, scriptSrc }),
    );
    await writeFile(join(outDir, "404.html"), await notFoundHtml(stylesheetSrc));
    await writeFile(join(outDir, "favicon.svg"), faviconSvg);
    await writeFile(join(outDir, "og.svg"), ogSvg);
    await writeFile(join(outDir, "robots.txt"), robotsTxt());
    await writeFile(join(outDir, "sitemap.xml"), sitemapXml());
    await writeFile(join(outDir, "_headers"), pagesHeaders());
}

export async function renderHomeHtml(
    options: {
        avatarSrc?: string;
        avatarAvifSrc?: string;
        avatarWebpSrc?: string;
        contributionDataSrc?: string;
        context?: HomepageContext;
        stylesheetSrc?: string;
        scriptSrc?: string;
    } = {},
) {
    const avatarSrc = options.avatarSrc ?? "/assets/avatar.jpg";
    const context = options.context ?? (await homepageContext());
    const page = HomePage({
        avatarSrc,
        avatarAvifSrc: options.avatarAvifSrc,
        avatarWebpSrc: options.avatarWebpSrc,
        contributionDataSrc: options.contributionDataSrc,
        context,
        renderDuration: "measuring...",
    });
    const document = renderToStaticMarkup(createElement(SiteDocument, { scriptSrc: options.scriptSrc }, page));
    return `<!DOCTYPE html>${document.replace("<body", `${headMarkup({ avatarSrc, stylesheetSrc: options.stylesheetSrc })}<body`)}`;
}

async function homepageContext() {
    return buildHomepageContext(await fetchSiteData());
}

export function robotsTxt() {
    return `User-agent: *
Allow: /
Sitemap: ${absoluteSiteUrl("/sitemap.xml")}
`;
}

export function sitemapXml() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${absoluteSiteUrl("/")}</loc>
  </url>
</urlset>
`;
}

export async function buildBehaviorBundle(deferredBehaviorSrc = "/site-behavior-deferred.js") {
    if (cachedBehaviorBundle?.includes(deferredBehaviorSrc)) return cachedBehaviorBundle;

    const result = await Bun.build({
        entrypoints: [join(siteRoot, "src", "app", "_behavior", "site-behavior.ts")],
        define: {
            DEFERRED_BEHAVIOR_SRC: JSON.stringify(deferredBehaviorSrc),
        },
        format: "esm",
        minify: true,
        target: "browser",
    });

    if (!result.success) {
        const message = result.logs.map((log) => log.message).join("\n") || "Unknown Bun build error";
        throw new Error(`Could not bundle site behavior: ${message}`);
    }

    cachedBehaviorBundle = await result.outputs[0].text();
    return cachedBehaviorBundle;
}

export async function buildDeferredBehaviorBundle() {
    if (cachedDeferredBehaviorBundle) return cachedDeferredBehaviorBundle;

    const result = await Bun.build({
        entrypoints: [join(siteRoot, "src", "app", "_behavior", "site-behavior-deferred.ts")],
        format: "esm",
        minify: true,
        target: "browser",
    });

    if (!result.success) {
        const message = result.logs.map((log) => log.message).join("\n") || "Unknown Bun build error";
        throw new Error(`Could not bundle deferred site behavior: ${message}`);
    }

    cachedDeferredBehaviorBundle = await result.outputs[0].text();
    return cachedDeferredBehaviorBundle;
}

function headMarkup({ avatarSrc, stylesheetSrc }: { avatarSrc: string; stylesheetSrc?: string }) {
    const ogImage = absoluteSiteUrl("/og.svg");
    const fullStylesheet = stylesheetSrc
        ? `<script>window.__fullStylesheetHref="${stylesheetSrc}"</script><noscript><link rel="stylesheet" href="${stylesheetSrc}"></noscript>`
        : `<link rel="stylesheet" href="/assets/site.css">`;

    return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${siteThemeColor}">
<title>${siteTitle}</title>
<meta name="description" content="${siteDescription}">
<meta property="og:title" content="${siteTitle}">
<meta property="og:description" content="${siteSocialDescription}">
<meta property="og:image" content="${ogImage}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${siteTitle}">
<meta name="twitter:description" content="${siteSocialDescription}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="/favicon.svg">
<style>${criticalCss}</style>
${fullStylesheet}
<script>${liveRenderDurationScript}</script>
</head>`;
}

const liveRenderDurationScript = `(()=>{let measured=null;const loadCss=()=>{const href=window.__fullStylesheetHref;if(!href||document.querySelector('link[data-full-stylesheet]'))return;const link=document.createElement("link");link.dataset.fullStylesheet="true";link.rel="stylesheet";link.href=href;document.head.appendChild(link)};const ready=()=>{loadCss();document.documentElement.dataset.auroraReady="true"};const format=(ms)=>{const ns=Math.max(0,Math.round(ms*1e6));return ms.toFixed(2)+"ms · "+ns.toLocaleString("en-US")+"ns"};const apply=()=>{if(measured===null)return;const target=document.querySelector("[data-render-duration]");if(!target)return;const value=format(measured);target.textContent=value;target.closest(".render-badge")?.setAttribute("aria-label","Rendered in "+value);requestAnimationFrame(ready)};const update=(ms)=>{measured=ms;apply()};const paint=performance.getEntriesByType("paint").find((entry)=>entry.name==="first-contentful-paint")??performance.getEntriesByType("paint").find((entry)=>entry.name==="first-paint");if(paint)update(paint.startTime);else if("PerformanceObserver"in window){let done=false;const observer=new PerformanceObserver((list)=>{const entry=list.getEntries().find((item)=>item.name==="first-contentful-paint")??list.getEntries().find((item)=>item.name==="first-paint");if(entry&&!done){done=true;observer.disconnect();update(entry.startTime)}});observer.observe({type:"paint",buffered:true});setTimeout(()=>{if(!done){done=true;observer.disconnect();requestAnimationFrame(()=>requestAnimationFrame(()=>update(performance.now()))) }},1500)}else requestAnimationFrame(()=>requestAnimationFrame(()=>update(performance.now())));if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});else apply()})();`;

function pagesHeaders() {
    return `/*
  Cache-Control: ${htmlCacheControl}

/assets/*
  ! Cache-Control
  Cache-Control: ${immutableAssetCacheControl}

/favicon.svg
  ! Cache-Control
  Cache-Control: ${immutableAssetCacheControl}

/og.svg
  ! Cache-Control
  Cache-Control: public, max-age=3600
`;
}

function contentHash(content: string | Uint8Array) {
    return createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function notFoundHtml(stylesheetSrc = "/assets/site.css") {
    return `<!DOCTYPE html><html lang="en" class="dark"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Not Found - krrt7.dev</title>
<link rel="icon" href="/favicon.svg">
<link rel="stylesheet" href="${stylesheetSrc}">
</head><body class="bg-black text-zinc-300"><main class="min-h-screen grid place-items-center px-6 text-center"><div><h1 class="text-4xl font-bold text-white">Not found</h1><p class="mt-4 text-zinc-400">This page does not exist.</p><a class="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10" href="/">Return home</a></div></main></body></html>`;
}

async function run(command: string, args: string[]) {
    const proc = Bun.spawn([command, ...args], {
        cwd: siteRoot,
        env: {
            ...Bun.env,
            BROWSERSLIST_IGNORE_OLD_DATA: "1",
        },
        stdout: "inherit",
        stderr: "inherit",
    });
    const code = await proc.exited;
    if (code !== 0) throw new Error(`${command} exited with code ${code}`);
}
