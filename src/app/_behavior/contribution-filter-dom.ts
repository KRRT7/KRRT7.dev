import {
    contributionEmptyMessage,
    contributionFilterCountLabel,
    contributionLoadMoreLabel,
    contributionMatchesFilter,
    isContributionFilterActive,
    type ContributionCardData,
    type ContributionFilterState,
} from "./contribution-filter-state";
import { languageBadgeClass, timeAgo } from "@/lib/format";

type DeferredContribution = ContributionCardData & {
    repositoryName: string;
    title: string;
    createdAt: string;
    url: string;
    number: number;
    isDraft: boolean;
    month: string;
};

type SerializedContribution =
    | DeferredContribution
    | [
          repositoryName: string,
          title: string,
          createdAt: string,
          merged: boolean,
          isDraft: boolean,
          url: string,
          number: number,
          languages: string[],
          month: string,
          state?: "OPEN" | "CLOSED",
      ];

export type ContributionCardElement = {
    element: HTMLElement | null;
    data: DeferredContribution;
};

export type ContributionFilterElements = {
    search: HTMLInputElement;
    statusButtons: HTMLElement[];
    languageButtons: HTMLElement[];
    filterCount: HTMLElement | null;
    clearButton: HTMLElement | null;
    emptyElement: HTMLElement | null;
    emptyMessage: HTMLElement | null;
    emptyReset: HTMLElement | null;
    loadMoreButton: HTMLElement | null;
    keyboardHint: HTMLElement | null;
    cards: ContributionCardElement[];
};

function readContributionCardData(card: HTMLElement): DeferredContribution {
    return {
        key: card.dataset.key ?? "",
        search: card.dataset.search ?? "",
        merged: card.dataset.merged === "true",
        state: card.dataset.state === "CLOSED" ? "CLOSED" : "OPEN",
        draft: card.dataset.draft === "true",
        languages: card.dataset.langs ? card.dataset.langs.split(",") : [],
        repositoryName: "",
        title: "",
        createdAt: "",
        url: "",
        number: 0,
        isDraft: card.dataset.draft === "true",
        month: card.closest<HTMLElement>(".month-group")?.dataset.month ?? "Unknown",
    };
}

function syncVisibleMonths() {
    document.querySelectorAll<HTMLElement>(".month-group").forEach((group) => {
        const hasVisible = Array.from(group.querySelectorAll<HTMLElement>(".pr-card")).some(
            (card) => card.style.display !== "none",
        );
        group.style.display = hasVisible ? "" : "none";
    });
}

function parseContributionDataFromText(text: string): DeferredContribution[] {
    try {
        const parsed = JSON.parse(text) as SerializedContribution[];
        return parsed.map(decodeContribution);
    } catch {
        return [];
    }
}

function decodeContribution(serialized: SerializedContribution): DeferredContribution {
    if (Array.isArray(serialized)) {
        const [repositoryName, title, createdAt, merged, isDraft, url, number, languages, month, state] = serialized;
        return {
            key: `${repositoryName}#${number}`,
            repositoryName,
            title,
            createdAt,
            merged: Boolean(merged),
            state: state === "CLOSED" ? "CLOSED" : Boolean(merged) ? "CLOSED" : "OPEN",
            draft: Boolean(isDraft),
            isDraft: Boolean(isDraft),
            url,
            number: Number(number || 0),
            languages: Array.isArray(languages) ? languages : [],
            month,
            search: `${repositoryName} ${title}`.toLowerCase(),
        };
    }

    return {
        ...serialized,
        key: `${serialized.repositoryName}#${serialized.number}`,
        draft: serialized.isDraft,
        languages: Array.isArray(serialized.languages) ? serialized.languages : [],
        search: serialized.search || `${serialized.repositoryName} ${serialized.title}`.toLowerCase(),
    };
}

function parseContributionData(): DeferredContribution[] {
    const source = document.getElementById("contribution-data");
    if (!source?.textContent) return [];
    return parseContributionDataFromText(source.textContent);
}

function contributionElementsFromData(data: DeferredContribution[]) {
    const existingCards = new Map(
        Array.from(document.querySelectorAll<HTMLElement>(".pr-card")).map((element) => [
            element.dataset.key ?? "",
            element,
        ]),
    );

    return data.map((cardData) => ({ element: existingCards.get(cardData.key) ?? null, data: cardData }));
}

export async function hydrateContributionData(elements: ContributionFilterElements) {
    const source = document.getElementById("contribution-data") as HTMLScriptElement | null;
    const src = source?.dataset.src;
    if (!src) return false;

    try {
        const response = await fetch(src, { credentials: "same-origin" });
        if (!response.ok) return false;
        const data = parseContributionDataFromText(await response.text());
        if (data.length === 0) return false;
        elements.cards = contributionElementsFromData(data);
        source.dataset.src = "";
        return true;
    } catch (error) {
        console.error("Could not hydrate contribution data", error);
        return false;
    }
}

export function collectContributionFilterElements(): ContributionFilterElements | null {
    const search = document.getElementById("pr-search") as HTMLInputElement | null;
    if (!search) return null;
    const serializedCards = parseContributionData();
    const cards =
        serializedCards.length > 0
            ? contributionElementsFromData(serializedCards)
            : Array.from(document.querySelectorAll<HTMLElement>(".pr-card")).map((element) => ({
                  element,
                  data: readContributionCardData(element),
              }));

    return {
        search,
        statusButtons: Array.from(document.querySelectorAll<HTMLElement>(".status-btn")),
        languageButtons: Array.from(document.querySelectorAll<HTMLElement>(".lang-btn")),
        filterCount: document.getElementById("filter-count"),
        clearButton: document.getElementById("clear-filters"),
        emptyElement: document.getElementById("pr-empty"),
        emptyMessage: document.getElementById("pr-empty-message"),
        emptyReset: document.getElementById("pr-empty-reset"),
        loadMoreButton: document.getElementById("load-more"),
        keyboardHint: document.getElementById("search-kbd"),
        cards,
    };
}

export function syncContributionFilterButtons(elements: ContributionFilterElements, state: ContributionFilterState) {
    elements.statusButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.status === state.status);
    });
    elements.languageButtons.forEach((button) => {
        button.classList.toggle("is-active", state.languages.includes(button.dataset.lang ?? ""));
    });
}

export function renderContributionFilters(
    elements: ContributionFilterElements,
    state: ContributionFilterState,
    shownLimit: number,
) {
    const filtered = isContributionFilterActive(state);
    const total = elements.cards.length;
    let pageIndex = 0;
    let visible = 0;

    elements.cards.forEach((card) => {
        const passes = contributionMatchesFilter(card.data, state);
        let show = passes;

        if (passes && !filtered) {
            pageIndex += 1;
            if (pageIndex > shownLimit) show = false;
        }

        if (show && !card.element) card.element = createContributionCard(card.data);
        if (card.element) card.element.style.display = show ? "" : "none";
        if (show) visible += 1;
    });

    syncVisibleMonths();

    if (elements.emptyElement) elements.emptyElement.style.display = visible === 0 ? "" : "none";
    if (elements.emptyMessage) {
        elements.emptyMessage.textContent =
            visible === 0 ? contributionEmptyMessage(state) : "No contributions match this filter.";
    }
    if (elements.filterCount) {
        elements.filterCount.textContent = contributionFilterCountLabel(visible, total, filtered);
    }
    if (elements.clearButton) elements.clearButton.style.display = filtered ? "" : "none";
    if (elements.emptyReset) elements.emptyReset.style.display = filtered ? "" : "none";

    if (elements.loadMoreButton) {
        const showButton = !filtered && shownLimit < total;
        elements.loadMoreButton.style.display = showButton ? "" : "none";

        const label = elements.loadMoreButton.querySelector("span");
        if (showButton && label) label.textContent = contributionLoadMoreLabel(total, shownLimit);
    }
}

function createContributionCard(data: DeferredContribution) {
    const group = ensureMonthGroup(data.month);
    const grid = group.querySelector<HTMLElement>(".pr-grid");
    const card = document.createElement("div");
    card.className = "pr-card";
    card.dataset.key = data.key;
    card.dataset.search = data.search;
    card.dataset.merged = String(data.merged);
    card.dataset.state = data.state;
    card.dataset.draft = String(data.draft);
    card.dataset.langs = data.languages.join(",");
    card.innerHTML = contributionCardHtml(data);
    grid?.append(card);
    return card;
}

function ensureMonthGroup(month: string) {
    let group = document.querySelector<HTMLElement>(`.month-group[data-month="${cssEscape(month)}"]`);
    if (group) return group;

    const emptyState = document.getElementById("pr-empty");
    group = document.createElement("div");
    group.className = "month-group";
    group.dataset.month = month;
    group.innerHTML = `<h3 class="month-title">${escapeHtml(month)}</h3><div class="pr-grid"></div>`;
    emptyState?.before(group);
    return group;
}

function contributionCardHtml(data: DeferredContribution) {
    const pythonMark = data.repositoryName.startsWith("python/")
        ? `<span class="python-project-mark" aria-hidden="true">Py</span>`
        : "";
    const languageBadges = data.languages
        .map(
            (language) =>
                `<span class="text-xs px-2 py-0.5 rounded-full border ${languageBadgeClass(language)}">${escapeHtml(language)}</span>`,
        )
        .join("");
    const statusIcon = data.merged
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-violet-500 w-7 h-7" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>`
        : data.state === "CLOSED"
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 w-6 h-6" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500 w-6 h-6" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" x2="6" y1="9" y2="21"/></svg>${data.draft ? `<span class="draft-badge">Draft</span>` : ""}`;

    return `<a href="${escapeAttribute(data.url)}" target="_blank" rel="noopener noreferrer" class="pr-card-link"><div class="pr-card-inner"><div class="pr-card-head"><div class="pr-card-repo">${pythonMark}<p>${escapeHtml(data.repositoryName)}</p></div><div class="pr-card-meta">${languageBadges}<span class="pr-time"><svg viewBox="0 0 512 512" fill="currentColor" class="w-4 h-4" aria-hidden="true"><path d="M256 0a256 256 0 1 1 0 512 256 256 0 1 1 0-512zm-24 120v136c0 8 4 16 11 20l96 64c11 7 26 4 33-7s4-26-7-33l-85-57V120c0-13-11-24-24-24s-24 11-24 24z"/></svg> ${timeAgo(data.createdAt)}</span></div></div><div class="pr-card-body"><div class="pr-card-icon">${statusIcon}</div><p class="pr-card-title">${escapeHtml(data.title)}</p></div></div></a>`;
}

function cssEscape(value: string) {
    return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

function escapeAttribute(value: string) {
    return escapeHtml(value);
}

const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};
