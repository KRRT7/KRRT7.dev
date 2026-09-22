import type { Cleanup } from "./dom";
import {
    CONTRIBUTION_PAGE_SIZE,
    INITIAL_CONTRIBUTION_COUNT,
    createDefaultContributionFilterState,
    isContributionFilterActive,
    readContributionFilterHash,
    serializeContributionFilterHash,
    type ContributionFilterState,
} from "./contribution-filter-state";
import {
    collectContributionFilterElements,
    hydrateContributionData,
    renderContributionFilters,
    syncContributionFilterButtons,
} from "./contribution-filter-dom";

function writeContributionFilterHash(state: ContributionFilterState) {
    const hash = serializeContributionFilterHash(state);
    history.replaceState(null, "", hash ? `#${hash}` : location.pathname + location.search);
}

export function installContributionFilters(cleanups: Cleanup[]) {
    const elements = collectContributionFilterElements();
    if (!elements) return;

    let state = createDefaultContributionFilterState();
    let shownLimit = INITIAL_CONTRIBUTION_COUNT;
    let hydrationPromise: Promise<boolean> | null = null;

    const syncUI = () => {
        syncContributionFilterButtons(elements, state);
    };

    const setState = (next: ContributionFilterState) => {
        state = next;
        elements.search.value = state.q;
    };

    const applyFilters = () => {
        state = { ...state, q: elements.search.value };
        renderContributionFilters(elements, state, shownLimit);
        writeContributionFilterHash(state);
    };
    const hydrate = () => {
        hydrationPromise ??= hydrateContributionData(elements).then((hydrated) => {
            if (hydrated) applyFilters();
            return hydrated;
        });
        return hydrationPromise;
    };

    const resetFilters = async () => {
        await hydrate();
        setState(createDefaultContributionFilterState());
        shownLimit = INITIAL_CONTRIBUTION_COUNT;
        syncUI();
        applyFilters();
        elements.search.focus();
    };

    const onFocus = () => {
        if (elements.keyboardHint) elements.keyboardHint.style.display = "none";
    };
    const onBlur = () => {
        if (elements.keyboardHint) elements.keyboardHint.style.display = "";
    };
    const onInput = async () => {
        await hydrate();
        shownLimit = INITIAL_CONTRIBUTION_COUNT;
        applyFilters();
    };

    elements.search.addEventListener("focus", onFocus);
    elements.search.addEventListener("blur", onBlur);
    elements.search.addEventListener("input", onInput);
    cleanups.push(() => {
        elements.search.removeEventListener("focus", onFocus);
        elements.search.removeEventListener("blur", onBlur);
        elements.search.removeEventListener("input", onInput);
    });

    elements.statusButtons.forEach((btn) => {
        const onClick = async () => {
            await hydrate();
            state = { ...state, status: btn.dataset.status ?? "all" };
            shownLimit = INITIAL_CONTRIBUTION_COUNT;
            syncUI();
            applyFilters();
        };
        btn.addEventListener("click", onClick);
        cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    elements.languageButtons.forEach((btn) => {
        const onClick = async () => {
            await hydrate();
            const lang = btn.dataset.lang ?? "";
            const languages = state.languages.includes(lang)
                ? state.languages.filter((activeLanguage) => activeLanguage !== lang)
                : [...state.languages, lang];
            state = { ...state, languages };
            shownLimit = INITIAL_CONTRIBUTION_COUNT;
            syncUI();
            applyFilters();
        };
        btn.addEventListener("click", onClick);
        cleanups.push(() => btn.removeEventListener("click", onClick));
    });

    elements.clearButton?.addEventListener("click", resetFilters);
    elements.emptyReset?.addEventListener("click", resetFilters);
    cleanups.push(() => {
        elements.clearButton?.removeEventListener("click", resetFilters);
        elements.emptyReset?.removeEventListener("click", resetFilters);
    });

    const onHashChange = async () => {
        await hydrate();
        setState(readContributionFilterHash(location.hash));
        shownLimit = INITIAL_CONTRIBUTION_COUNT;
        syncUI();
        applyFilters();
    };
    window.addEventListener("hashchange", onHashChange);
    cleanups.push(() => window.removeEventListener("hashchange", onHashChange));

    if (elements.loadMoreButton) {
        const onClick = async () => {
            elements.loadMoreButton?.setAttribute("aria-busy", "true");
            await hydrate();
            elements.loadMoreButton?.removeAttribute("aria-busy");
            const prevHidden = new Set(
                elements.cards.filter((card) => !card.element || card.element.style.display === "none"),
            );
            shownLimit += CONTRIBUTION_PAGE_SIZE;
            applyFilters();
            elements.cards.forEach((card) => {
                const element = card.element;
                if (element && prevHidden.has(card) && element.style.display !== "none") {
                    element.classList.remove("pr-fade-in");
                    void element.offsetWidth;
                    element.classList.add("pr-fade-in");
                    element.addEventListener("animationend", () => element.classList.remove("pr-fade-in"), {
                        once: true,
                    });
                }
            });
        };
        elements.loadMoreButton.addEventListener("click", onClick);
        cleanups.push(() => elements.loadMoreButton?.removeEventListener("click", onClick));
    }

    const initial = readContributionFilterHash(location.hash);
    if (isContributionFilterActive(initial)) {
        hydrate().then(() => {
            setState(initial);
            syncUI();
            applyFilters();
        });
    }
}
