import type { Cleanup } from "./dom";

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    twinkle: number;
};

export function installSparkles(cleanups: Cleanup[]) {
    const host = document.getElementById("sparkles-canvas");
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const resetParticle = (particle = {} as Particle) => {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
        particle.vx = (Math.random() - 0.5) * 0.16;
        particle.vy = -0.08 - Math.random() * 0.18;
        particle.radius = 0.6 + Math.random() * 1.8;
        particle.alpha = 0.12 + Math.random() * 0.55;
        particle.twinkle = 0.008 + Math.random() * 0.02;
        return particle;
    };

    const resize = () => {
        if (!canvas || !ctx) return;
        const rect = host.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = reduceMotion ? 28 : Math.min(90, Math.max(36, Math.round((width * height) / 1400)));
        particles.length = 0;
        for (let i = 0; i < count; i += 1) particles.push(resetParticle());
    };

    const draw = () => {
        const context = ctx;
        if (!context) return;
        context.clearRect(0, 0, width, height);
        particles.forEach((particle) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha += particle.twinkle;
            if (particle.alpha > 0.75 || particle.alpha < 0.12) particle.twinkle *= -1;
            if (particle.y < -8 || particle.x < -8 || particle.x > width + 8) {
                resetParticle(particle).y = height + 8;
            }

            context.beginPath();
            context.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fill();
        });
        frame = requestAnimationFrame(draw);
    };

    const start = () => {
        if (canvas) return;

        canvas = document.createElement("canvas");
        canvas.className = "sparkles-canvas";
        host.replaceChildren(canvas);

        ctx = canvas.getContext("2d");
        if (!ctx) return;

        resize();
        if (!reduceMotion) frame = requestAnimationFrame(draw);
        else draw();

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
    };

    const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
            if (!entry.isIntersecting) return;
            start();
            visibilityObserver.disconnect();
        },
        { rootMargin: "300px" },
    );
    visibilityObserver.observe(host);

    cleanups.push(() => {
        visibilityObserver.disconnect();
        resizeObserver?.disconnect();
        cancelAnimationFrame(frame);
    });
}
