import { GITHUB_API_BASE, GITHUB_GRAPHQL_URL, GITHUB_USER_AGENT } from "./github-config";

export type GraphqlResponse<TData extends object = Record<string, unknown>> = {
    data?: TData;
    errors?: Array<{ message: string }>;
};

const jsonHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": GITHUB_USER_AGENT,
};

export async function githubFetch<T>(path: string, token: string): Promise<T> {
    const resp = await fetch(`${GITHUB_API_BASE}${path}`, {
        headers: {
            ...jsonHeaders,
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    if (!resp.ok) {
        throw new Error(`GitHub request failed: ${resp.status} ${resp.statusText}`);
    }

    return (await resp.json()) as T;
}

export async function graphql<TData extends object = Record<string, unknown>>(
    query: string,
    token: string,
    variables: Record<string, unknown> = {},
): Promise<GraphqlResponse<TData>> {
    const resp = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: {
            ...jsonHeaders,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
    });

    if (!resp.ok) {
        throw new Error(`GitHub GraphQL failed: ${resp.status} ${resp.statusText}`);
    }

    return (await resp.json()) as GraphqlResponse<TData>;
}
