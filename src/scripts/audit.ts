import { createServer } from "node:net";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import axe from "axe-core";
import { chromium } from "playwright";
import type { Page } from "playwright";
import { htmlCacheControl, immutableAssetCacheControl, pagesOutDir } from "@/site/static-output";

declare global {
    interface Window {
        axe: typeof axe;
    }
}

type LighthouseCategory = "performance" | "accessibility" | "best-practices" | "seo";

const root = import.meta.dir.replace(/\/src\/scripts$/, "");
const bin = (name: string) => join(root, "node_modules", ".bin", name);
const port = Number(Bun.env.AUDIT_PORT ?? 0);
const chromePath = findChrome();
const lighthouseReport = join(root, ".cache", "audit-lighthouse.json");

const lighthouseThresholds: Record<LighthouseCategory, number> = {
    performance: 1,
    accessibility: 1,
    "best-practices": 1,
    seo: 1,
};

const artifactBudgets = {
    html: 85_000,
    criticalBehavior: 16_000,
    deferredBehavior: 4_000,
    contributionData: 105_000,
    css: 35_000,
    avatar: 12_000,
    avatarAvif: 5_000,
    avatarWebp: 7_000,
    total: 250_000,
};

async function main() {
    await run("bun", ["test"]);
    await run("bun", ["run", "build"]);
    await runArtifactBudgetAudit();
    await runStaticDeployAudit();
}

async function runArtifactBudgetAudit() {
    const assets = await readdir(join(pagesOutDir, "assets"));
    const files = {
        html: join(pagesOutDir, "index.html"),
        criticalBehavior: join(pagesOutDir, "assets", requiredAsset(assets, /^site-behavior\.[^.]+\.js$/)),
        deferredBehavior: join(pagesOutDir, "assets", requiredAsset(assets, /^site-behavior-deferred\.[^.]+\.js$/)),
        contributionData: join(pagesOutDir, "assets", requiredAsset(assets, /^contributions\.[^.]+\.json$/)),
        css: join(pagesOutDir, "assets", requiredAsset(assets, /^site\.[^.]+\.css$/)),
        avatar: join(pagesOutDir, "assets", requiredAsset(assets, /^avatar\.[^.]+\.jpg$/)),
        avatarAvif: join(pagesOutDir, "assets", requiredAsset(assets, /^avatar\.[^.]+\.avif$/)),
        avatarWebp: join(pagesOutDir, "assets", requiredAsset(assets, /^avatar\.[^.]+\.webp$/)),
    };
    const sizes = {
        html: await fileSize(files.html),
        criticalBehavior: await fileSize(files.criticalBehavior),
        deferredBehavior: await fileSize(files.deferredBehavior),
        contributionData: await fileSize(files.contributionData),
        css: await fileSize(files.css),
        avatar: await fileSize(files.avatar),
        avatarAvif: await fileSize(files.avatarAvif),
        avatarWebp: await fileSize(files.avatarWebp),
    };
    const total = Object.values(sizes).reduce((sum, size) => sum + size, 0);
    const failures = Object.entries(sizes).flatMap(([name, size]) => {
        const budget = artifactBudgets[name as keyof typeof sizes];
        return size <= budget ? [] : [`${name} ${size} > ${budget}`];
    });

    if (total > artifactBudgets.total) failures.push(`total ${total} > ${artifactBudgets.total}`);
    if (failures.length > 0) throw new Error(`Artifact budget failed: ${failures.join(", ")}`);

    console.log(
        `artifacts: html ${sizes.html}B, js ${sizes.criticalBehavior + sizes.deferredBehavior}B, ` +
            `data ${sizes.contributionData}B, css ${sizes.css}B, total ${total}B`,
    );
}

function requiredAsset(assets: string[], pattern: RegExp) {
    const match = assets.find((asset) => pattern.test(asset));
    if (!match) throw new Error(`Missing asset matching ${pattern}`);
    return match;
}

async function fileSize(path: string) {
    return (await stat(path)).size;
}

async function runLinkAudit(url: string) {
    await run(bin("linkinator"), [url, "--recurse", "--verbosity", "error"]);
}

async function runHtmlCodeSniffer(url: string) {
    await run(bin("pa11y"), [url, "--runner", "htmlcs", "--wait", "500"], chromeEnv());
}

async function runAxe(url: string) {
    const browser = await chromium.launch({
        executablePath: chromePath,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle" });
        await page.addScriptTag({ content: axe.source });
        const result = await page.evaluate(async () => {
            const audit = await window.axe.run(document, {
                runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
            });
            return audit.violations.map((violation) => ({
                id: violation.id,
                impact: violation.impact,
                targets: violation.nodes.map((node) => node.target.join(" ")),
            }));
        });

        if (result.length > 0) {
            throw new Error(`axe found ${result.length} violation(s): ${JSON.stringify(result, null, 2)}`);
        }

        console.log("axe: 0 WCAG A/AA violations");
    } finally {
        await browser.close();
    }
}

async function runLighthouse(
    url: string,
    outputPath: string,
    thresholds: Record<LighthouseCategory, number>,
    label: string,
) {
    await mkdir(join(root, ".cache"), { recursive: true });
    await run(
        bin("lighthouse"),
        [
            url,
            "--quiet",
            "--output=json",
            `--output-path=${outputPath}`,
            "--only-categories=performance,accessibility,best-practices,seo",
            "--chrome-flags=--headless=new --no-sandbox",
        ],
        chromeEnv(),
    );

    const report = await Bun.file(outputPath).json() as {
        categories: Record<LighthouseCategory, { score: number | null }>;
    };

    const failures = Object.entries(thresholds).flatMap(([category, threshold]) => {
        const score = report.categories[category as LighthouseCategory]?.score ?? 0;
        return score >= threshold ? [] : [`${category}: ${Math.round(score * 100)} < ${Math.round(threshold * 100)}`];
    });

    if (failures.length > 0) {
        throw new Error(`Lighthouse score threshold failed: ${failures.join(", ")}`);
    }

    const scores = Object.keys(lighthouseThresholds)
        .map((category) => `${category} ${Math.round((report.categories[category as LighthouseCategory]?.score ?? 0) * 100)}`)
        .join(", ");
    console.log(`lighthouse (${label}): ${scores}`);
}

async function runStaticDeployAudit() {
    const auditPort = await getFreePort();
    const url = `http://127.0.0.1:${auditPort}`;
    const server = startStaticServer(auditPort);

    try {
        await waitForUrl(url);
        await runLinkAudit(url);
        await runHtmlCodeSniffer(url);
        await runAxe(url);
        await runInteractionAudit(url);
        await runLighthouse(url, lighthouseReport, lighthouseThresholds, "static cold");
        await runHotRuntimeAudit(url);
    } finally {
        server.stop(true);
    }
}

async function runInteractionAudit(url: string) {
    const browser = await chromium.launch({
        executablePath: chromePath,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));

        await page.goto(url, { waitUntil: "networkidle" });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const renderBadge = await page.locator("[data-render-duration]").textContent();
        if (!renderBadge || !/^\d+\.\d{2}ms · [\d,]+ns$/.test(renderBadge)) {
            throw new Error(`Live render duration badge did not update: ${renderBadge}`);
        }

        const initial = await contributionState(page);
        if (initial.cards !== 6 || initial.visible !== 6) {
            throw new Error(`Expected 6 initial contribution cards, got ${JSON.stringify(initial)}`);
        }

        await page.locator("#load-more").click();
        await page.waitForFunction(() => document.querySelectorAll(".pr-card").length > 6);
        const loaded = await contributionState(page);
        if (loaded.cards < 30 || loaded.visible < 30) {
            throw new Error(`Load more did not add cards: ${JSON.stringify(loaded)}`);
        }

        await page.locator("#pr-search").fill("pip");
        await page.waitForTimeout(100);
        const searched = await contributionState(page);
        if (searched.visible <= 0 || !searched.filterCount?.includes("Showing")) {
            throw new Error(`Contribution search did not filter cards: ${JSON.stringify(searched)}`);
        }

        await page.locator("#clear-filters").click();
        await page.waitForTimeout(100);

        await page.locator("#discord-copy").click();
        const copied = await page.locator("#discord-copy").getAttribute("data-copied");
        if (copied !== "true") throw new Error("Discord copy interaction did not set data-copied");

        for (const id of ["about", "projects", "contributions"]) {
            await page.locator(`#${id}`).scrollIntoViewIfNeeded();
            await page.waitForTimeout(100);
            const visible = await page.locator(`#${id}`).evaluate((element) => {
                const reveal = element.closest(".reveal-section") as HTMLElement | null;
                const rect = element.getBoundingClientRect();
                return {
                    opacity: reveal ? getComputedStyle(reveal).opacity : "1",
                    width: rect.width,
                    height: rect.height,
                };
            });
            if (visible.opacity === "0" || visible.width === 0 || visible.height === 0) {
                throw new Error(`${id} section is not visibly rendered: ${JSON.stringify(visible)}`);
            }
        }

        if (consoleErrors.length > 0 || pageErrors.length > 0) {
            throw new Error(`Interaction audit runtime errors: ${JSON.stringify({ consoleErrors, pageErrors }, null, 2)}`);
        }

        console.log("interactions: load more, filters, copy, and section visibility passed");
    } finally {
        await browser.close();
    }
}

async function contributionState(page: Page) {
    return await page.evaluate(() => ({
        cards: document.querySelectorAll(".pr-card").length,
        visible: [...document.querySelectorAll<HTMLElement>(".pr-card")].filter(
            (element) => getComputedStyle(element).display !== "none",
        ).length,
        buttonText: document.querySelector("#load-more span")?.textContent ?? "",
        filterCount: document.querySelector("#filter-count")?.textContent ?? "",
    }));
}

async function runHotRuntimeAudit(url: string) {
    const browser = await chromium.launch({
        executablePath: chromePath,
        args: ["--no-sandbox"],
    });

    try {
        const page = await browser.newPage();
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];
        page.on("console", (message) => {
            if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));

        const cold = await measurePageLoad(page, url);
        const hot = await measurePageLoad(page, url);

        if (consoleErrors.length > 0 || pageErrors.length > 0) {
            throw new Error(`Runtime errors detected: ${JSON.stringify({ consoleErrors, pageErrors }, null, 2)}`);
        }

        const failures = [
            cold.cumulativeLayoutShift > 0.01 && `cold CLS ${cold.cumulativeLayoutShift.toFixed(3)} > 0.01`,
            hot.cumulativeLayoutShift > 0.01 && `hot CLS ${hot.cumulativeLayoutShift.toFixed(3)} > 0.01`,
            hot.loadEventEnd > cold.loadEventEnd * 1.25 && `hot load ${Math.round(hot.loadEventEnd)}ms is slower than cold ${Math.round(cold.loadEventEnd)}ms`,
        ].filter(Boolean);

        if (failures.length > 0) throw new Error(`Hot runtime audit failed: ${failures.join(", ")}`);

        console.log(
            `runtime: cold load ${Math.round(cold.loadEventEnd)}ms, hot load ${Math.round(hot.loadEventEnd)}ms, ` +
                `cold CLS ${cold.cumulativeLayoutShift.toFixed(3)}, hot CLS ${hot.cumulativeLayoutShift.toFixed(3)}`,
        );
    } finally {
        await browser.close();
    }
}

async function measurePageLoad(page: Page, url: string) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    return await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const layoutShiftEntries = performance.getEntriesByType("layout-shift") as PerformanceEntry[];
        const cumulativeLayoutShift = layoutShiftEntries.reduce((total, entry) => {
            const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
            return shift.hadRecentInput ? total : total + (shift.value ?? 0);
        }, 0);

        return {
            loadEventEnd: navigation.loadEventEnd,
            domContentLoaded: navigation.domContentLoadedEventEnd,
            cumulativeLayoutShift,
        };
    });
}

function startStaticServer(auditPort: number) {
    return Bun.serve({
        port: auditPort,
        async fetch(request) {
            const url = new URL(request.url);
            const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
            const file = Bun.file(join(pagesOutDir, pathname));

            if (await file.exists()) {
                return new Response(file, { headers: staticHeaders(pathname) });
            }

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

    const cacheControl = pathname.startsWith("/assets/")
        ? immutableAssetCacheControl
        : htmlCacheControl;

    return {
        "Cache-Control": cacheControl,
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

async function run(command: string, args: string[], env: Record<string, string | undefined> = {}) {
    console.log(`$ ${[command, ...args].join(" ")}`);
    const proc = Bun.spawn([command, ...args], {
        cwd: root,
        env: { ...Bun.env, ...env },
        stdout: "inherit",
        stderr: "inherit",
    });
    const code = await proc.exited;
    if (code !== 0) throw new Error(`${command} exited with code ${code}`);
}

async function getFreePort() {
    return await new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            server.close(() => {
                if (address && typeof address === "object") resolve(address.port);
                else reject(new Error("Could not allocate an audit port"));
            });
        });
    });
}

function chromeEnv() {
    return chromePath
        ? {
            CHROME_PATH: chromePath,
            PUPPETEER_EXECUTABLE_PATH: chromePath,
        }
        : {};
}

function findChrome() {
    return Bun.env.CHROME_PATH
        ?? Bun.env.PUPPETEER_EXECUTABLE_PATH
        ?? firstExisting([
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/usr/bin/google-chrome",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
        ]);
}

function firstExisting(paths: string[]) {
    return paths.find((path) => existsSync(path));
}

main().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
