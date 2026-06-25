import type { CacheMetadata } from "./site-types";

export function fmtNumber(value: number): string {
    return new Intl.NumberFormat("en-US").format(value);
}

export function cacheStatus(cache?: CacheMetadata): string {
    if (!cache) return "";
    if (cache.source === "live") return "Live data";
    if (typeof cache.ageSeconds !== "number") return "Cached data";

    const minutes = Math.floor(cache.ageSeconds / 60);
    if (minutes < 1) return "Cached just now";
    if (minutes < 60) return `Cached ${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Cached ${hours}h ago`;

    return `Cached ${Math.floor(hours / 24)}d ago`;
}

export function timeAgo(dateStr: string): string {
    const then = Date.parse(dateStr);
    if (Number.isNaN(then)) return "just now";

    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
}

export function languageBadgeClass(language: string): string {
    const colors: Record<string, string> = {
        Python: "border-blue-500 text-blue-400",
        TypeScript: "border-blue-400 text-blue-300",
        JavaScript: "border-yellow-500 text-yellow-400",
        Rust: "border-orange-600 text-orange-500",
        Go: "border-cyan-500 text-cyan-400",
        Shell: "border-green-600 text-green-400",
        C: "border-gray-500 text-gray-400",
        "C++": "border-pink-500 text-pink-400",
        Ruby: "border-red-500 text-red-400",
        HTML: "border-orange-400 text-orange-300",
        CSS: "border-purple-500 text-purple-400",
        Cython: "border-blue-600 text-blue-500",
    };

    return colors[language] ?? "border-zinc-600 text-zinc-400";
}
