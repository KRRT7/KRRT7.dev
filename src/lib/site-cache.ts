import type { CacheMetadata, SiteData } from "./site-types";

const CACHE_TTL_SECONDS = Number(Bun.env.GITHUB_CACHE_TTL_SECONDS || 900);
const CACHE_DIR = ".cache";
const CACHE_FILE = `${CACHE_DIR}/github-data.json`;

async function cacheAgeSeconds(): Promise<number> {
    const file = Bun.file(CACHE_FILE, { type: "application/json" });
    const exists = await file.exists();
    if (!exists) throw new Error("Cache file does not exist");
    return Math.max(0, Math.floor((Date.now() - file.lastModified) / 1000));
}

export async function cacheMetadata(source: CacheMetadata["source"]): Promise<CacheMetadata> {
    if (source === "live") {
        return { source: "live", ageSeconds: 0 };
    }

    try {
        const ageSeconds = await cacheAgeSeconds();
        return {
            source: "cache",
            ageSeconds,
            fresh: ageSeconds < CACHE_TTL_SECONDS,
        };
    } catch {
        return { source: "cache" };
    }
}

export async function readCachedData(allowStale = false): Promise<SiteData | null> {
    try {
        const ageSeconds = await cacheAgeSeconds();
        if (!allowStale && ageSeconds >= CACHE_TTL_SECONDS) {
            return null;
        }

        return (await Bun.file(CACHE_FILE, { type: "application/json" }).json()) as SiteData;
    } catch {
        return null;
    }
}

export async function storeData(data: SiteData): Promise<void> {
    try {
        Bun.spawnSync(["mkdir", "-p", CACHE_DIR]);
        await Bun.write(CACHE_FILE, JSON.stringify(data, null, 2));
    } catch {
    }
}
