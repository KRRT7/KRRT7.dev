import type { CacheMetadata, PullRequest, SiteData } from "./site-types";
import { INITIAL_CONTRIBUTION_COUNT } from "@/app/_behavior/contribution-filter-state";

export type PullRequestGroup = {
    month: string;
    pullRequests: PullRequest[];
};

export type HomepageContext = {
    stats: {
        totalStars: number;
        totalCommits: number;
    };
    projects: SiteData["projects"];
    cache: CacheMetadata;
    contributions: {
        total: number;
        rendered: number;
        allPullRequests: PullRequest[];
        pullRequests: PullRequest[];
        groups: PullRequestGroup[];
        languages: string[];
    };
    currentYear: number;
    currentDate: string;
};

export function monthLabel(dateStr: string): string {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function groupPullRequests(pullRequests: PullRequest[]): PullRequestGroup[] {
    const groups: PullRequestGroup[] = [];
    const byMonth = new Map<string, PullRequest[]>();

    pullRequests.forEach((pr) => {
        const month = monthLabel(pr.createdAt);
        let group = byMonth.get(month);
        if (!group) {
            group = [];
            byMonth.set(month, group);
            groups.push({ month, pullRequests: group });
        }
        group.push(pr);
    });

    return groups;
}

function sortedLanguages(pullRequests: PullRequest[]): string[] {
    const counts = new Map<string, number>();
    pullRequests.forEach((pr) => {
        pr.languages.forEach((language) => counts.set(language, (counts.get(language) ?? 0) + 1));
    });

    return Array.from(counts.entries())
        .sort(([aLang, aCount], [bLang, bCount]) => bCount - aCount || aLang.localeCompare(bLang))
        .map(([language]) => language);
}

export function buildHomepageContext(data: SiteData): HomepageContext {
    const pullRequests = data.contributions.pullRequests ?? [];
    const renderedPullRequests = pullRequests.slice(0, INITIAL_CONTRIBUTION_COUNT);
    const now = new Date();

    return {
        stats: {
            totalStars: Number(data.stats.totalStars || 0),
            totalCommits: Number(data.stats.totalCommits || 0),
        },
        projects: data.projects ?? [],
        cache: data.cache ?? { source: "live", ageSeconds: 0 },
        contributions: {
            total: pullRequests.length,
            rendered: renderedPullRequests.length,
            allPullRequests: pullRequests,
            pullRequests: renderedPullRequests,
            groups: groupPullRequests(renderedPullRequests),
            languages: sortedLanguages(pullRequests),
        },
        currentYear: now.getFullYear(),
        currentDate: now.toISOString().slice(0, 10),
    };
}
