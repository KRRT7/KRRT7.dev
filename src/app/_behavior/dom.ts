export type Cleanup = () => void;

export function setClassName(el: Element, value: string) {
    el.setAttribute("class", value);
}

export function currentSectionIndex(ids: string[]) {
    let active = 0;
    for (let i = ids.length - 1; i >= 0; i -= 1) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.5) {
            active = i;
            break;
        }
    }
    return active;
}

export function cleanupAll(cleanups: Cleanup[]) {
    cleanups.forEach((cleanup) => cleanup());
}
