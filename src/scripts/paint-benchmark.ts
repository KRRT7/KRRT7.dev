import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { htmlCacheControl, immutableAssetCacheControl, pagesOutDir } from "@/site/static-output";

type PaintSample = {
    firstPaint: number | null;
    firstContentfulPaint: number | null;
    badge: number | null;
    domContentLoaded: number;
    load: number;
    transferSize: number;
    encodedBodySize: number;
    resourceCount: number;
};

const root = import.meta.dir.replace(/\/src\/scripts$/, "");
const samples = Number(Bun.env.PAINT_SAMPLES ?? 15);
const warmups = Number(Bun.env.PAINT_WARMUPS ?? 3);
const port = Number(Bun.env.PAINT_PORT ?? 0);

await run("bun", ["run", "build"]);

const auditPort = port || await getFreePort();
const url = `http://127.0.0.1:${auditPort}`;
const server = startStaticServer(auditPort);

try {
    await waitForUrl(url);
    await benchmarkPaint(url);
} finally {
    server.stop(true);
}

async function benchmarkPaint(url: string) {
    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const results: PaintSample[] = [];

    try {
        for (let i = 0; i < warmups + samples; i += 1) {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.waitForFunction(() => !document.querySelector("[data-render-duration]")?.textContent?.includes("measuring"));
            const sample = await page.evaluate(() => {
                const paint = performance.getEntriesByType("paint") as PerformancePaintTiming[];
                const firstPaint = paint.find((entry) => entry.name === "first-paint")?.startTime ?? null;
                const firstContentfulPaint =
                    paint.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;
                const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
                const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
                const badgeText = document.querySelector("[data-render-duration]")?.textContent ?? "";
                const badge = Number(badgeText.match(/^([\d.]+)ms/)?.[1] ?? NaN);

                return {
                    firstPaint,
                    firstContentfulPaint,
                    badge: Number.isFinite(badge) ? badge : null,
                    domContentLoaded: navigation.domContentLoadedEventEnd,
                    load: navigation.loadEventEnd,
                    transferSize: resources.reduce((total, entry) => total + entry.transferSize, 0),
                    encodedBodySize: resources.reduce((total, entry) => total + entry.encodedBodySize, 0),
                    resourceCount: resources.length,
                };
            });

            if (i >= warmups) results.push(sample);
        }
    } finally {
        await browser.close();
    }

    report("first-paint", results.map((sample) => sample.firstPaint).filter(isNumber));
    report("first-contentful-paint", results.map((sample) => sample.firstContentfulPaint).filter(isNumber));
    report("badge", results.map((sample) => sample.badge).filter(isNumber));
    report("dom-content-loaded", results.map((sample) => sample.domContentLoaded));
    report("load", results.map((sample) => sample.load));

    const resourceCounts = results.map((sample) => sample.resourceCount);
    const transferSizes = results.map((sample) => sample.transferSize);
    const encodedSizes = results.map((sample) => sample.encodedBodySize);
    console.log(`resources: count ${median(resourceCounts)}, transfer ${median(transferSizes)}B, encoded ${median(encodedSizes)}B`);
}

function report(label: string, values: number[]) {
    if (values.length === 0) {
        console.log(`${label}: unavailable`);
        return;
    }

    const sorted = [...values].sort((a, b) => a - b);
    console.log(
        `${label}: min ${formatMs(sorted[0])}, median ${formatMs(median(sorted))}, p95 ${formatMs(percentile(sorted, 0.95))}, max ${formatMs(sorted[sorted.length - 1])}`,
    );
}

function median(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    return percentile(sorted, 0.5);
}

function percentile(sortedValues: number[], percentileValue: number) {
    if (sortedValues.length === 0) return 0;
    const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * percentileValue) - 1));
    return sortedValues[index];
}

function formatMs(value: number) {
    return `${value.toFixed(2)}ms`;
}

function isNumber(value: number | null): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function startStaticServer(auditPort: number) {
    return Bun.serve({
        port: auditPort,
        async fetch(request) {
            const url = new URL(request.url);
            const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
            const file = Bun.file(join(pagesOutDir, pathname));

            if (await file.exists()) return new Response(file, { headers: staticHeaders(pathname) });
            return new Response(Bun.file(join(pagesOutDir, "404.html")), {
                status: 404,
                headers: staticHeaders("/404.html"),
            });
        },
    });
}

function staticHeaders(pathname: string) {
    const contentType = pathname.endsWith(".css")
        ? "text/css; charset=utf-8"
        : pathname.endsWith(".js")
            ? "text/javascript; charset=utf-8"
            : pathname.endsWith(".json")
                ? "application/json; charset=utf-8"
                : pathname.endsWith(".svg")
                    ? "image/svg+xml"
                    : pathname.endsWith(".xml")
                        ? "application/xml; charset=utf-8"
                        : pathname.endsWith(".txt")
                            ? "text/plain; charset=utf-8"
                            : pathname.endsWith(".jpg")
                                ? "image/jpeg"
                                : pathname.endsWith(".avif")
                                    ? "image/avif"
                                    : pathname.endsWith(".webp")
                                        ? "image/webp"
                                : "text/html; charset=utf-8";

    return {
        "Cache-Control": pathname.startsWith("/assets/") ? immutableAssetCacheControl : htmlCacheControl,
        "Content-Type": contentType,
    };
}

async function waitForUrl(url: string) {
    const timeoutAt = Date.now() + 15_000;
    while (Date.now() < timeoutAt) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            // Server is still starting.
        }
        await delay(250);
    }
    throw new Error(`Timed out waiting for ${url}`);
}

async function getFreePort() {
    return await new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            server.close(() => {
                if (address && typeof address === "object") resolve(address.port);
                else reject(new Error("Could not allocate a benchmark port"));
            });
        });
    });
}

async function run(command: string, args: string[]) {
    console.log(`$ ${[command, ...args].join(" ")}`);
    const proc = Bun.spawn([command, ...args], {
        cwd: root,
        env: { ...Bun.env },
        stdout: "inherit",
        stderr: "inherit",
    });
    const code = await proc.exited;
    if (code !== 0) throw new Error(`${command} exited with code ${code}`);
}
