export const SECTION_IDS = ["hero", "about", "projects"] as const;

export function nextSectionIndex(current: number, direction: "next" | "previous", sectionCount = SECTION_IDS.length) {
    if (direction === "next") return Math.min(current + 1, sectionCount - 1);
    return Math.max(current - 1, 0);
}

export function isEditableElement(element: Element | null | undefined) {
    const tag = element?.tagName;
    return tag === "INPUT" || tag === "TEXTAREA";
}

export function shouldFocusContributionSearch(event: KeyboardEvent, activeElement: Element | null | undefined) {
    return event.key === "/" && !event.metaKey && !event.ctrlKey && !isEditableElement(activeElement);
}

export function keyboardDirection(event: KeyboardEvent): "next" | "previous" | null {
    if (event.key === "ArrowDown") return "next";
    if (event.key === "ArrowUp") return "previous";
    return null;
}
