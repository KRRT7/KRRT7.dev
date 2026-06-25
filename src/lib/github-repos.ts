import type { components } from "@octokit/openapi-types";
import { githubFetch } from "./github-transport";

export type GitHubRepo = components["schemas"]["full-repository"];

export async function getAllRepos(token: string): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;

    while (true) {
        try {
            const payload = await githubFetch<GitHubRepo[]>(
                `/user/repos?visibility=public&affiliation=owner&per_page=100&page=${page}`,
                token,
            );
            if (!Array.isArray(payload) || payload.length === 0) break;
            repos.push(...payload);
            page += 1;
        } catch {
            break;
        }
    }

    return repos;
}
