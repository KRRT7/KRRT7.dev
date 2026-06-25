import type { Cleanup } from "./dom";

export function installDiscordCopy(cleanups: Cleanup[]) {
    const btn = document.getElementById("discord-copy");
    const text = document.getElementById("discord-text");
    if (!btn || !text) return;

    const onClick = () => {
        navigator.clipboard?.writeText(".krrt").catch(() => {});
        text.textContent = "Copied!";
        btn.setAttribute("data-copied", "true");
        window.setTimeout(() => {
            text.textContent = ".krrt";
            btn.removeAttribute("data-copied");
        }, 3000);
    };

    btn.addEventListener("click", onClick);
    cleanups.push(() => btn.removeEventListener("click", onClick));
}

export function installClock(cleanups: Cleanup[]) {
    const display = document.getElementById("clock-display");
    if (!display) return;
    let timer = 0;
    const update = () => {
        display.textContent = new Date().toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
        timer = window.setTimeout(update, msUntilNextMinute);
    };

    update();
    cleanups.push(() => window.clearTimeout(timer));
}

export function installCardTilt(cleanups: Cleanup[]) {
    const container = document.getElementById("card-3d-container");
    if (!container) return;

    const onMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / 25;
        const y = (event.clientY - rect.top - rect.height / 2) / 25;
        container.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
    };
    const onLeave = () => {
        container.style.transform = "rotateY(0deg) rotateX(0deg)";
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    cleanups.push(() => {
        container.removeEventListener("mousemove", onMove);
        container.removeEventListener("mouseleave", onLeave);
    });
}

export function installRevealSections(cleanups: Cleanup[]) {
    document.querySelectorAll(".reveal-section").forEach((el) => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.remove("opacity-0", "translate-y-6");
                    el.classList.add("opacity-100", "translate-y-0");
                    observer.unobserve(el);
                }
            },
            { threshold: 0.05 },
        );
        observer.observe(el);
        cleanups.push(() => observer.disconnect());
    });
}
