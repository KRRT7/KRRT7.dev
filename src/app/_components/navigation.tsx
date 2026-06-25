import { IconArrowUp } from "./icons";

export function NavDots() {
    return (
        <div
            className="fixed right-2 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center z-50 nav-dots"
            id="nav-dots"
        >
            {[
                ["hero", "Home"],
                ["about", "About"],
                ["projects", "Projects"],
            ].map(([id, label], index) => (
                <button
                    className="group relative flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 nav-dot-button"
                    data-nav={id}
                    aria-label={label}
                    key={id}
                >
                    <div
                        className="nav-dot rounded-full transition-all duration-300 w-2 h-2 bg-zinc-600"
                        data-index={index}
                    />
                    <span className="absolute right-full mr-3 px-2 py-0.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap nav-tooltip">
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}

export function BackToTop() {
    return (
        <button
            id="back-to-top"
            className="fixed bottom-8 right-4 lg:right-8 z-50 flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all duration-300 opacity-0 translate-y-4 pointer-events-none"
            aria-label="Back to top"
        >
            <IconArrowUp className="w-5 h-5" />
        </button>
    );
}
