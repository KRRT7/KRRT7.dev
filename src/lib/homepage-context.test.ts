import { describe, expect, test } from "bun:test";
import { buildHomepageContext } from "./homepage-context";
import type { SiteData } from "./site-types";

describe("buildHomepageContext", () => {
    test("normalizes stats, groups pull requests, and sorts languages by frequency", () => {
        const data: SiteData = {
            stats: { totalStars: 12, totalCommits: 34 },
            projects: [],
            cache: { source: "cache", ageSeconds: 60 },
            contributions: {
                pullRequests: [
                    {
                        repositoryName: "krrt7/one",
                        title: "first",
                        createdAt: "2026-06-10T00:00:00Z",
                        merged: true,
                        state: "CLOSED",
                        isDraft: false,
                        url: "https://example.com/1",
                        number: 1,
                        languages: ["TypeScript", "Python"],
                    },
                    {
                        repositoryName: "krrt7/two",
                        title: "second",
                        createdAt: "2026-06-12T00:00:00Z",
                        merged: false,
                        state: "OPEN",
                        isDraft: true,
                        url: "https://example.com/2",
                        number: 2,
                        languages: ["Python"],
                    },
                ],
            },
        };

        const context = buildHomepageContext(data);

        expect(context.stats).toEqual({ totalStars: 12, totalCommits: 34 });
        expect(context.contributions.rendered).toBe(2);
        expect(context.contributions.groups).toHaveLength(1);
        expect(context.contributions.groups[0].month).toBe("June 2026");
        expect(context.contributions.languages).toEqual(["Python", "TypeScript"]);
    });
});
