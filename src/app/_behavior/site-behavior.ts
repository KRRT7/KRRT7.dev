import { installContributionFilters } from "./contribution-filters";
import { cleanupAll, type Cleanup } from "./dom";
import { installBackToTop, installKeyboardNav, installNavDots } from "./navigation";
import { installDiscordCopy } from "./widgets";

declare const DEFERRED_BEHAVIOR_SRC: string;

const criticalInstallers = [
    installNavDots,
    installBackToTop,
    installDiscordCopy,
    installContributionFilters,
    installKeyboardNav,
];

function installSiteBehavior(installers: ((cleanups: Cleanup[]) => void)[]) {
    const cleanups: Cleanup[] = [];
    installers.forEach((install) => install(cleanups));
    return cleanups;
}

function loadDeferredBehavior(cleanups: Cleanup[]) {
    import(DEFERRED_BEHAVIOR_SRC)
        .then(({ installDeferredBehavior }) => installDeferredBehavior(cleanups))
        .catch(() => {});
}

function boot() {
    const cleanups = installSiteBehavior(criticalInstallers);
    const schedule = globalThis.requestIdleCallback ?? ((callback: IdleRequestCallback) => setTimeout(callback, 500));
    schedule(() => loadDeferredBehavior(cleanups), { timeout: 1_500 });
    globalThis.addEventListener("pagehide", () => cleanupAll(cleanups), { once: true });
}

if (document.readyState === "loading") {
    globalThis.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
    boot();
}
