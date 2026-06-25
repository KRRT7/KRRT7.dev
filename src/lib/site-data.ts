import { getAllPullRequests } from "./github-contributions";
import { githubToken } from "./github-auth";
import { getAllRepos, type GitHubRepo } from "./github-repos";
import { cacheMetadata, readCachedData, storeData } from "./site-cache";
import type { Project, SiteData } from "./site-types";

const EMPTY_SITE_DATA: SiteData = {
    contributions: { total: 0, pullRequests: [] },
    stats: { totalStars: 0, totalCommits: 0 },
    projects: [],
};

function repoCountsTowardStars(repo: GitHubRepo) {
    return !repo.fork;
}

function repoCountsAsProject(repo: GitHubRepo) {
    return !repo.fork && !repo.archived && !repo.private;
}

function projectFromRepo(repo: GitHubRepo): Project {
    return {
        name: repo.name,
        description: repo.description,
        stars: Number(repo.stargazers_count || 0),
        language: repo.language,
        url: repo.html_url,
        homepage: repo.homepage || null,
    };
}

async function buildSiteData(): Promise<SiteData | null> {
    const token = githubToken();
    if (!token) return null;

    try {
        const [pullRequests, repos] = await Promise.all([getAllPullRequests(token), getAllRepos(token)]);
        const totalStars = repos
            .filter(repoCountsTowardStars)
            .reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);
        const projects = repos
            .filter(repoCountsAsProject)
            .map(projectFromRepo)
            .sort((a, b) => b.stars - a.stars)
            .slice(0, 6);

        const data = {
            contributions: { total: pullRequests.length, pullRequests },
            stats: { totalStars, totalCommits: pullRequests.length },
            projects,
        };

        await storeData(data);
        return data;
    } catch {
        return null;
    }
}

export async function fetchSiteData(): Promise<SiteData> {
    const cached = await readCachedData();
    if (cached) return { ...cached, cache: await cacheMetadata("cache") };

    const live = await buildSiteData();
    if (live) return { ...live, cache: await cacheMetadata("live") };

    const stale = await readCachedData(true);
    if (stale) return { ...stale, cache: await cacheMetadata("cache") };

    return { ...EMPTY_SITE_DATA, cache: await cacheMetadata("live") };
}
