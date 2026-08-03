import { fetchPrLanguages } from "./github-languages";
import {
    assignPullRequestLanguages,
    type GithubPullRequestNode,
    mergeUniquePullRequests,
    pullRequestFromGithubNode,
} from "./github-pr-mapper";
import { draftPullRequestsQuery, pullRequestContributionsQuery } from "./github-pr-queries";
import { graphql, type GraphqlResponse } from "./github-transport";
import type { PullRequest } from "./site-types";

export const EXCLUDED_REPOSITORIES = new Set(["KRRT7/codeflash"]);

type DraftPullRequestsData = {
    search?: {
        nodes?: GithubPullRequestNode[];
    } | null;
};

type PullRequestContributionNode = {
    pullRequest?: GithubPullRequestNode;
};

type PullRequestContributionsData = {
    user?: {
        contributionsCollection?: {
            pullRequestContributions?: {
                pageInfo?: {
                    hasNextPage?: boolean | null;
                    endCursor?: string | null;
                } | null;
                nodes?: PullRequestContributionNode[];
            } | null;
        } | null;
    } | null;
};

type PullRequestContributionsPage = NonNullable<
    NonNullable<
        NonNullable<PullRequestContributionsData["user"]>["contributionsCollection"]
    >["pullRequestContributions"]
>;

async function getDraftPullRequests(token: string): Promise<PullRequest[]> {
    const data = await graphql<DraftPullRequestsData>(draftPullRequestsQuery(), token);
    const nodes = data.data?.search?.nodes ?? [];

    return nodes.map(pullRequestFromGithubNode).filter((pr: PullRequest | null): pr is PullRequest => Boolean(pr));
}

export async function getAllPullRequests(token: string): Promise<PullRequest[]> {
    const pullRequests: PullRequest[] = [];
    let cursor: string | null = null;

    for (let pageCount = 0; pageCount < 10; pageCount += 1) {
        const data: GraphqlResponse<PullRequestContributionsData> = await graphql<PullRequestContributionsData>(
            pullRequestContributionsQuery(),
            token,
            { cursor },
        );
        const prContribs: PullRequestContributionsPage | undefined =
            data.data?.user?.contributionsCollection?.pullRequestContributions ?? undefined;
        const nodes = prContribs?.nodes ?? [];

        nodes.forEach((node) => {
            const pr = pullRequestFromGithubNode(node?.pullRequest);
            if (!pr) return;
            pullRequests.push(pr);
        });

        if (!prContribs?.pageInfo?.hasNextPage) break;
        cursor = prContribs.pageInfo.endCursor ?? null;
    }

    const drafts = await getDraftPullRequests(token);
    mergeUniquePullRequests(pullRequests, drafts);
    const filteredPullRequests = pullRequests.filter(
        (pr) => !EXCLUDED_REPOSITORIES.has(pr.repositoryName) && (pr.merged || pr.state !== "CLOSED"),
    );
    const langMap = await fetchPrLanguages(token, filteredPullRequests);

    return assignPullRequestLanguages(filteredPullRequests, langMap);
}
