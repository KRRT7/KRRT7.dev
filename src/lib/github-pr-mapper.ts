import type { PullRequest } from "./site-types";

export type GithubPullRequestNode = {
    repository?: {
        owner?: {
            login?: string | null;
        } | null;
        name?: string | null;
    } | null;
    number?: number | null;
    title?: string | null;
    merged?: boolean | null;
    state?: "OPEN" | "CLOSED" | null;
    isDraft?: boolean | null;
    createdAt?: string | null;
    url?: string | null;
} | null | undefined;

export function pullRequestKey(pr: Pick<PullRequest, "repositoryName" | "number">) {
    return `${pr.repositoryName}#${pr.number}`;
}

export function pullRequestFromGithubNode(node: GithubPullRequestNode): PullRequest | null {
    if (!node) return null;

    const owner = node.repository?.owner?.login ?? "";
    const name = node.repository?.name ?? "";

    return {
        repositoryName: `${owner}/${name}`,
        title: node.title ?? "",
        createdAt: node.createdAt ?? "",
        merged: Boolean(node.merged),
        state: node.state ?? (node.merged ? "CLOSED" : "OPEN"),
        isDraft: Boolean(node.isDraft),
        url: node.url ?? "",
        number: Number(node.number || 0),
        languages: [],
    };
}

export function mergeUniquePullRequests(base: PullRequest[], additions: PullRequest[]) {
    const seen = new Set(base.map(pullRequestKey));

    additions.forEach((pr) => {
        const key = pullRequestKey(pr);
        if (!seen.has(key)) {
            seen.add(key);
            base.push(pr);
        }
    });

    return base;
}

export function assignPullRequestLanguages(pullRequests: PullRequest[], languagesByPullRequest: Record<string, string[]>) {
    pullRequests.forEach((pr) => {
        pr.languages = languagesByPullRequest[pullRequestKey(pr)] ?? [];
    });

    return pullRequests;
}
