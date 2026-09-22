import { chromium, type Browser, type Page } from "playwright";

type RemoteSample = {
    firstPaint: number | null;
    firstContentfulPaint: number | null;
    badge: number | null;
    timeToFirstByte: number;
    domContentLoaded: number;
    load: number;
    transferSize: number;
    encodedBodySize: number;
    resourceCount: number;
};

const remoteUrl = Bun.env.REMOTE_URL;
const samples = Number(Bun.env.REMOTE_SAMPLES ?? 10);

if (!remoteUrl) {
    throw new Error("Set REMOTE_URL to the deployed site URL, for example: REMOTE_URL=https://example.pages.dev bun run perf:remote");
}

const url = new URL(remoteUrl).toString();
await printHeaders(url);

const browser = await chromium.launch({ args: ["--no-sandbox"] });

try {
    const cold = await collectColdSamples(browser, url);
    const hot = await collectHotSamples(browser, url);

    console.log("\nremote cold fresh-context");
    reportSamples(cold);
    console.log("\nremote hot same-browser");
    reportSamples(hot);
} finally {
    await browser.close();
}

async function collectColdSamples(browser: Browser, targetUrl: string) {
    const results: RemoteSample[] = [];

    for (let i = 0; i < samples; i += 1) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();

        try {
            await page.goto(targetUrl, { waitUntil: "networkidle" });
            await waitForRenderBadge(page);
            results.push(await readSample(page));
        } finally {
            await context.close();
        }
    }

    return results;
}

async function collectHotSamples(browser: Browser, targetUrl: string) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const results: RemoteSample[] = [];

    try {
        await page.goto(targetUrl, { waitUntil: "networkidle" });
        await waitForRenderBadge(page);

        for (let i = 0; i < samples; i += 1) {
            await page.goto(targetUrl, { waitUntil: "networkidle" });
            await waitForRenderBadge(page);
            results.push(await readSample(page));
        }
    } finally {
        await context.close();
    }

    return results;
}

async function waitForRenderBadge(page: Page) {
    await page.waitForFunction(() => !document.querySelector("[data-render-duration]")?.textContent?.includes("measuring"));
}

async function readSample(page: Page): Promise<RemoteSample> {
    return await page.evaluate(() => {
        const paint = performance.getEntriesByType("paint") as PerformancePaintTiming[];
        const firstPaint = paint.find((entry) => entry.name === "first-paint")?.startTime ?? null;
        const firstContentfulPaint = paint.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const badgeText = document.querySelector("[data-render-duration]")?.textContent ?? "";
        const badge = Number(badgeText.match(/^([\d.]+)ms/)?.[1] ?? NaN);

        return {
            firstPaint,
            firstContentfulPaint,
            badge: Number.isFinite(badge) ? badge : null,
            timeToFirstByte: navigation.responseStart,
            domContentLoaded: navigation.domContentLoadedEventEnd,
            load: navigation.loadEventEnd,
            transferSize: resources.reduce((total, entry) => total + entry.transferSize, 0),
            encodedBodySize: resources.reduce((total, entry) => total + entry.encodedBodySize, 0),
            resourceCount: resources.length,
        };
    });
}

function reportSamples(results: RemoteSample[]) {
    report("first-paint", results.map((sample) => sample.firstPaint).filter(isNumber));
    report("first-contentful-paint", results.map((sample) => sample.firstContentfulPaint).filter(isNumber));
    report("badge", results.map((sample) => sample.badge).filter(isNumber));
    report("time-to-first-byte", results.map((sample) => sample.timeToFirstByte));
    report("dom-content-loaded", results.map((sample) => sample.domContentLoaded));
    report("load", results.map((sample) => sample.load));

    const resourceCounts = results.map((sample) => sample.resourceCount);
    const transferSizes = results.map((sample) => sample.transferSize);
    const encodedSizes = results.map((sample) => sample.encodedBodySize);
    console.log(`resources: count ${median(resourceCounts)}, transfer ${formatBytes(median(transferSizes))}, encoded ${formatBytes(median(encodedSizes))}`);
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

async function printHeaders(targetUrl: string) {
    const response = await fetch(targetUrl, {
        headers: {
            "Accept-Encoding": "br, gzip",
        },
    });
    const cacheControl = response.headers.get("cache-control") ?? "unknown";
    const contentEncoding = response.headers.get("content-encoding") ?? "identity";
    const contentType = response.headers.get("content-type") ?? "unknown";
    const server = response.headers.get("server") ?? "unknown";

    console.log(`url: ${targetUrl}`);
    console.log(`status: ${response.status}`);
    console.log(`server: ${server}`);
    console.log(`content-type: ${contentType}`);
    console.log(`content-encoding: ${contentEncoding}`);
    console.log(`cache-control: ${cacheControl}`);
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

function formatBytes(value: number) {
    return `${Math.round(value)}B`;
}

function isNumber(value: number | null): value is number {
    return typeof value === "number" && Number.isFinite(value);
}
