import { describe, expect, test } from "bun:test";
import { isEditableElement, keyboardDirection, nextSectionIndex, shouldFocusContributionSearch } from "./navigation-state";

function keyEvent(key: string, modifiers: Partial<KeyboardEvent> = {}) {
    return { key, metaKey: false, ctrlKey: false, ...modifiers } as KeyboardEvent;
}

describe("navigation state", () => {
    test("bounds section navigation", () => {
        expect(nextSectionIndex(0, "previous", 3)).toBe(0);
        expect(nextSectionIndex(0, "next", 3)).toBe(1);
        expect(nextSectionIndex(2, "next", 3)).toBe(2);
    });

    test("detects keyboard navigation direction", () => {
        expect(keyboardDirection(keyEvent("ArrowDown"))).toBe("next");
        expect(keyboardDirection(keyEvent("ArrowUp"))).toBe("previous");
        expect(keyboardDirection(keyEvent("Enter"))).toBeNull();
    });

    test("does not hijack editable elements", () => {
        expect(isEditableElement({ tagName: "INPUT" } as Element)).toBe(true);
        expect(isEditableElement({ tagName: "TEXTAREA" } as Element)).toBe(true);
        expect(isEditableElement({ tagName: "DIV" } as Element)).toBe(false);

        expect(shouldFocusContributionSearch(keyEvent("/"), { tagName: "DIV" } as Element)).toBe(true);
        expect(shouldFocusContributionSearch(keyEvent("/"), { tagName: "INPUT" } as Element)).toBe(false);
        expect(shouldFocusContributionSearch(keyEvent("/", { metaKey: true }), { tagName: "DIV" } as Element)).toBe(
            false,
        );
    });
});
