export const DEFAULT_CONTRIBUTION_STATUS = "all";
export const INITIAL_CONTRIBUTION_COUNT = 6;
export const CONTRIBUTION_PAGE_SIZE = 24;

export type ContributionFilterState = {
    q: string;
    status: string;
    languages: string[];
};

export type ContributionCardData = {
    key: string;
    search: string;
    merged: boolean;
    draft: boolean;
    languages: string[];
};

export function createDefaultContributionFilterState(): ContributionFilterState {
    return {
        q: "",
        status: DEFAULT_CONTRIBUTION_STATUS,
        languages: [],
    };
}

export function readContributionFilterHash(hash: string): ContributionFilterState {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    return {
        q: params.get("q") ?? "",
        status: params.get("status") ?? DEFAULT_CONTRIBUTION_STATUS,
        languages: params.get("lang")?.split(",").filter(Boolean) ?? [],
    };
}

export function serializeContributionFilterHash(state: ContributionFilterState) {
    const params = new URLSearchParams();
    const query = state.q.trim();

    if (query) params.set("q", query);
    if (state.status !== DEFAULT_CONTRIBUTION_STATUS) params.set("status", state.status);
    if (state.languages.length > 0) params.set("lang", state.languages.join(","));

    return params.toString();
}

export function isContributionFilterActive(state: ContributionFilterState) {
    return state.q.trim() !== "" || state.status !== DEFAULT_CONTRIBUTION_STATUS || state.languages.length > 0;
}

export function contributionMatchesFilter(card: ContributionCardData, state: ContributionFilterState) {
    const query = state.q.toLowerCase().trim();
    const matchesSearch = !query || card.search.includes(query);
    const matchesStatus =
        state.status === DEFAULT_CONTRIBUTION_STATUS ||
        (state.status === "merged" && card.merged) ||
        (state.status === "open" && !card.merged && !card.draft) ||
        (state.status === "draft" && card.draft);
    const matchesLanguage =
        state.languages.length === 0 || state.languages.some((language) => card.languages.includes(language));

    return matchesSearch && matchesStatus && matchesLanguage;
}

export function contributionEmptyMessage(state: ContributionFilterState) {
    const query = state.q.trim();

    if (query) return `No contributions match "${query}".`;
    if (state.status !== DEFAULT_CONTRIBUTION_STATUS || state.languages.length > 0) {
        return "No contributions match this filter. Try another status or language.";
    }

    return "No contributions found yet.";
}

export function contributionFilterCountLabel(visible: number, total: number, filtered: boolean) {
    return filtered ? `Showing ${visible} of ${total}` : `${total} contributions`;
}

export function contributionLoadMoreLabel(total: number, shownLimit: number) {
    return `Load ${Math.min(CONTRIBUTION_PAGE_SIZE, total - shownLimit)} more`;
}
