import { currentSectionIndex, setClassName } from "./dom";
import { SECTION_IDS } from "./navigation-state";

export type NavigationElements = {
    scrollParent: Element;
    navButtons: HTMLElement[];
    navDots: Element[];
    backToTopButton: HTMLElement | null;
};

export function collectNavigationElements(): NavigationElements | null {
    const scrollParent = document.querySelector(".page-shell");
    if (!scrollParent) return null;

    return {
        scrollParent,
        navButtons: Array.from(document.querySelectorAll<HTMLElement>("[data-nav]")),
        navDots: Array.from(document.querySelectorAll(".nav-dot")),
        backToTopButton: document.getElementById("back-to-top"),
    };
}

export function activeSectionIndex() {
    return currentSectionIndex([...SECTION_IDS]);
}

export function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function renderNavDots(dots: Element[], active: number) {
    dots.forEach((dot, i) => {
        setClassName(
            dot,
            `nav-dot rounded-full transition-all duration-300 ${
                i === active ? "w-3 h-3 bg-zinc-300" : "w-2 h-2 bg-zinc-600"
            }`,
        );
    });
}

export function renderBackToTop(button: HTMLElement, visible: boolean) {
    setClassName(
        button,
        `fixed bottom-8 right-4 lg:right-8 z-50 flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all duration-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`,
    );
}

export function isHeroScrolledPast() {
    const hero = document.getElementById("hero");
    return Boolean(hero && hero.getBoundingClientRect().bottom < 0);
}
