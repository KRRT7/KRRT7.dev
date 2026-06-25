import type { Cleanup } from "./dom";
import {
    activeSectionIndex,
    collectNavigationElements,
    isHeroScrolledPast,
    renderBackToTop,
    renderNavDots,
    scrollToSection,
} from "./navigation-dom";
import {
    keyboardDirection,
    nextSectionIndex,
    SECTION_IDS,
    shouldFocusContributionSearch,
    isEditableElement,
} from "./navigation-state";

export function installNavDots(cleanups: Cleanup[]) {
    const elements = collectNavigationElements();
    if (!elements) return;
    let frame = 0;

    const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            renderNavDots(elements.navDots, activeSectionIndex());
        });
    };

    elements.scrollParent.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => {
        elements.scrollParent.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(frame);
    });

    elements.navButtons.forEach((btn) => {
        const onClick = () => {
            const id = btn.getAttribute("data-nav");
            if (id) scrollToSection(id);
        };
        btn.addEventListener("click", onClick);
        cleanups.push(() => btn.removeEventListener("click", onClick));
    });
}

export function installBackToTop(cleanups: Cleanup[]) {
    const elements = collectNavigationElements();
    if (!elements?.backToTopButton) return;
    let frame = 0;

    const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            renderBackToTop(elements.backToTopButton!, isHeroScrolledPast());
        });
    };
    const onClick = () => scrollToSection("hero");

    elements.scrollParent.addEventListener("scroll", onScroll, { passive: true });
    elements.backToTopButton.addEventListener("click", onClick);
    cleanups.push(() => {
        elements.scrollParent.removeEventListener("scroll", onScroll);
        elements.backToTopButton?.removeEventListener("click", onClick);
        cancelAnimationFrame(frame);
    });
}

export function installKeyboardNav(cleanups: Cleanup[]) {
    const onKeyDown = (event: KeyboardEvent) => {
        if (shouldFocusContributionSearch(event, document.activeElement)) {
            const searchEl = document.getElementById("pr-search");
            if (!searchEl) return;
            event.preventDefault();
            scrollToSection("projects");
            searchEl.focus();
            return;
        }

        const direction = keyboardDirection(event);
        if (!direction || isEditableElement(document.activeElement)) return;
        event.preventDefault();

        const current = activeSectionIndex();
        const next = nextSectionIndex(current, direction);

        if (next !== current) {
            scrollToSection(SECTION_IDS[next]);
        }
    };

    document.addEventListener("keydown", onKeyDown);
    cleanups.push(() => document.removeEventListener("keydown", onKeyDown));
}
