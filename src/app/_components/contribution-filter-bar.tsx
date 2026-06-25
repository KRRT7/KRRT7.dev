export function ContributionFilterBar({ languages }: { languages: string[] }) {
    return (
        <div
            id="pr-filters"
            className="sticky top-0 lg:top-0 z-40 mb-4 rounded-2xl border border-zinc-900 bg-zinc-950/80 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.28)] p-3 flex flex-col gap-2"
        >
            <div className="flex flex-wrap gap-2 items-center">
                <div className="relative w-full sm:w-72">
                    <input
                        id="pr-search"
                        type="search"
                        aria-label="Search contributions"
                        placeholder="Search repos or PR titles..."
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 pr-8 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 w-full"
                    />
                    <kbd
                        id="search-kbd"
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.5 text-xs text-zinc-300 border border-zinc-700 rounded font-mono pointer-events-none"
                    >
                        /
                    </kbd>
                </div>
                <div className="flex gap-1.5 flex-wrap" id="status-filters">
                    {["all", "merged", "open", "draft"].map((status) => (
                        <button
                            className={`status-btn px-3 py-0.5 text-xs rounded-full border transition-colors cursor-pointer ${
                                status === "all"
                                    ? "border-zinc-700 text-zinc-300"
                                    : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                            }`}
                            data-status={status}
                            key={status}
                            type="button"
                        >
                            {status[0].toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            {languages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5" id="lang-filters">
                    {languages.map((language) => (
                        <button
                            className="lang-btn px-2 py-0.5 text-xs rounded-full border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors cursor-pointer"
                            data-lang={language}
                            key={language}
                            type="button"
                        >
                            {language}
                        </button>
                    ))}
                </div>
            ) : null}
            <div className="flex items-center gap-3 min-h-4">
                <p id="filter-count" className="text-xs text-zinc-300" aria-live="polite" />
                <button
                    id="clear-filters"
                    style={{ display: "none" }}
                    className="text-xs px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors cursor-pointer"
                    type="button"
                >
                    Reset filters
                </button>
            </div>
        </div>
    );
}
