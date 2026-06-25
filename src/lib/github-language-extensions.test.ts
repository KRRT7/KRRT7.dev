import { describe, expect, test } from "bun:test";
import { githubLanguageForPath } from "./github-language-extensions";

describe("githubLanguageForPath", () => {
    test("detects languages from common extensions", () => {
        expect(githubLanguageForPath("src/app/page.tsx")).toBe("TypeScript");
        expect(githubLanguageForPath("scripts/deploy.sh")).toBe("Shell");
        expect(githubLanguageForPath("README.md")).toBe("Markdown");
    });

    test("detects extensionless known filenames", () => {
        expect(githubLanguageForPath("Dockerfile")).toBe("Dockerfile");
        expect(githubLanguageForPath("nested/Makefile")).toBe("Makefile");
    });

    test("returns undefined for unknown paths", () => {
        expect(githubLanguageForPath("notes.unknown")).toBeUndefined();
        expect(githubLanguageForPath("LICENSE")).toBeUndefined();
    });
});
