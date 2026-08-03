export type PullRequest = {
    repositoryName: string;
    title: string;
    createdAt: string;
    merged: boolean;
    state: "OPEN" | "CLOSED";
    isDraft: boolean;
    url: string;
    number: number;
    languages: string[];
};

export type Project = {
    name: string;
    description: string | null;
    stars: number;
    language: string | null;
    url: string;
    homepage: string | null;
};

export type SiteData = {
    contributions: {
        total: number;
        pullRequests: PullRequest[];
    };
    stats: {
        totalStars: number;
        totalCommits: number;
    };
    projects: Project[];
    cache?: CacheMetadata;
};

export type CacheMetadata = {
    source: "live" | "cache";
    ageSeconds?: number;
    fresh?: boolean;
};
