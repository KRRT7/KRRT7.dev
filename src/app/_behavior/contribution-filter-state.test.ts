import { describe, expect, test } from "bun:test";
import {
    contributionMatchesFilter,
    createDefaultContributionFilterState,
    isContributionFilterActive,
    readContributionFilterHash,
    serializeContributionFilterHash,
} from "./contribution-filter-state";

describe("contribution filter state", () => {
    test("round-trips active hash state", () => {
        const state = readContributionFilterHash("#q=python&status=merged&lang=Python,TypeScript");

        expect(state).toEqual({
            q: "python",
            status: "merged",
            languages: ["Python", "TypeScript"],
        });
        expect(serializeContributionFilterHash(state)).toBe("q=python&status=merged&lang=Python%2CTypeScript");
    });

    test("detects active and inactive filters", () => {
        expect(isContributionFilterActive(createDefaultContributionFilterState())).toBe(false);
        expect(isContributionFilterActive({ q: "bun", status: "all", languages: [] })).toBe(true);
        expect(isContributionFilterActive({ q: "", status: "draft", languages: [] })).toBe(true);
        expect(isContributionFilterActive({ q: "", status: "all", languages: ["TypeScript"] })).toBe(true);
    });

    test("matches cards by search, status, and language", () => {
        const card = {
            key: "oven-sh/bun#1",
            search: "oven-sh bun native runtime",
            merged: false,
            state: "OPEN" as const,
            draft: true,
            languages: ["TypeScript", "Shell"],
        };

        expect(contributionMatchesFilter(card, { q: "bun", status: "draft", languages: ["TypeScript"] })).toBe(true);
        expect(contributionMatchesFilter(card, { q: "python", status: "draft", languages: ["TypeScript"] })).toBe(false);
        expect(contributionMatchesFilter(card, { q: "bun", status: "open", languages: ["TypeScript"] })).toBe(false);
        expect(contributionMatchesFilter(card, { q: "bun", status: "draft", languages: ["Python"] })).toBe(false);
        expect(
            contributionMatchesFilter(
                { ...card, merged: false, draft: false, state: "CLOSED" },
                { q: "bun", status: "closed", languages: [] },
            ),
        ).toBe(true);
        expect(contributionMatchesFilter(card, { q: "bun", status: "closed", languages: [] })).toBe(false);
    });
});
