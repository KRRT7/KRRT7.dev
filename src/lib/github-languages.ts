import { githubLanguageForPath } from "./github-language-extensions";
import { graphql } from "./github-transport";
import type { PullRequest } from "./site-types";

type GithubPullRequestFileNode = {
    path?: string | null;
} | null;

type PullRequestFilesAlias = {
    pullRequest?: {
        files?: {
            nodes?: GithubPullRequestFileNode[];
        } | null;
    } | null;
} | null;

type PullRequestFilesData = Record<`pr${number}`, PullRequestFilesAlias | undefined>;

export async function fetchPrLanguages(
    token: string,
    pullRequests: PullRequest[],
): Promise<Record<string, string[]>> {
    if (pullRequests.length === 0) return {};

    const result: Record<string, string[]> = {};
    const batchSize = 20;

    for (let start = 0; start < pullRequests.length; start += batchSize) {
        const batch = pullRequests.slice(start, start + batchSize);
        const aliases = batch.map((pr, i) => {
            const [owner, name] = pr.repositoryName.split("/", 2);
            return `
                pr${i}: repository(owner: "${owner}", name: "${name}") {
                  pullRequest(number: ${pr.number}) {
                    files(first: 50) { nodes { path } }
                  }
                }
            `;
        });

        const data = await graphql<PullRequestFilesData>(`query { ${aliases.join(" ")} }`, token);
        const payload = data.data ?? {};
        batch.forEach((pr, i) => {
            const files = payload[`pr${i}`]?.pullRequest?.files?.nodes ?? [];
            const seen = new Set<string>();
            const languages: string[] = [];

            files.forEach((file) => {
                const language = githubLanguageForPath(String(file?.path ?? ""));
                if (language && !seen.has(language)) {
                    seen.add(language);
                    languages.push(language);
                }
            });

            result[`${pr.repositoryName}#${pr.number}`] = languages;
        });
    }

    return result;
}
