import { describe, expect, test } from "bun:test";
import { cacheStatus, fmtNumber, languageBadgeClass } from "./format";

describe("format helpers", () => {
    test("formats numbers for display", () => {
        expect(fmtNumber(1234567)).toBe("1,234,567");
    });

    test("describes live and cached data", () => {
        expect(cacheStatus({ source: "live", ageSeconds: 0 })).toBe("Live data");
        expect(cacheStatus({ source: "cache", ageSeconds: 0 })).toBe("Cached just now");
        expect(cacheStatus({ source: "cache", ageSeconds: 120 })).toBe("Cached 2m ago");
        expect(cacheStatus({ source: "cache", ageSeconds: 7_200 })).toBe("Cached 2h ago");
        expect(cacheStatus({ source: "cache", ageSeconds: 172_800 })).toBe("Cached 2d ago");
    });

    test("maps known and unknown language badge classes", () => {
        expect(languageBadgeClass("Python")).toContain("border-blue-500");
        expect(languageBadgeClass("Something Else")).toBe("border-zinc-600 text-zinc-400");
    });
});
