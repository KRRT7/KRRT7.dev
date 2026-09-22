import type { Cleanup } from "./dom";
import { installSparkles } from "./sparkles";
import { installCardTilt, installClock, installRevealSections } from "./widgets";

const deferredInstallers = [
    installClock,
    installCardTilt,
    installRevealSections,
    installSparkles,
];

export function installDeferredBehavior(cleanups: Cleanup[]) {
    deferredInstallers.forEach((install) => install(cleanups));
}
