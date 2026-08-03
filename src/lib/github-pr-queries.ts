import { GITHUB_USER } from "./github-config";

export function draftPullRequestsQuery() {
    return `
        query {
          search(query: "author:${GITHUB_USER} is:pr is:draft", type: ISSUE, first: 100) {
            nodes {
              ... on PullRequest {
                repository { owner { login } name }
                number title merged state isDraft createdAt url
              }
            }
          }
        }
    `;
}

export function pullRequestContributionsQuery() {
    return `
        query($cursor: String) {
          user(login: "${GITHUB_USER}") {
            contributionsCollection {
              pullRequestContributions(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  pullRequest {
                    repository { owner { login } name }
                    number title merged state isDraft createdAt url
                  }
                }
              }
            }
          }
        }
    `;
}
