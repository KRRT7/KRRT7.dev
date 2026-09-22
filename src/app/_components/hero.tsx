import avatar from "@/app/_assets/avatar.jpg";
import { RenderBadge } from "@/site/render-badge";
import { IconCheck, IconCopy, IconDiscord, IconEnvelope, IconGithub } from "./icons";

const defaultAvatarSrc = typeof avatar === "string" ? "/assets/avatar.jpg" : avatar.src;

export function Hero({
    renderDuration,
    avatarSrc = defaultAvatarSrc,
    avatarAvifSrc,
    avatarWebpSrc,
}: {
    renderDuration: string;
    avatarSrc?: string;
    avatarAvifSrc?: string;
    avatarWebpSrc?: string;
}) {
    return (
        <section id="hero" className="snap-start h-screen relative">
            <div className="hero-stage relative flex flex-col h-full items-center justify-center bg-black">
                <RenderBadge renderDuration={renderDuration} />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="hero-aurora absolute -inset-[10px]" />
                </div>
                <div className="hero-content relative flex flex-col items-center justify-center px-4">
                    <div className="hero-frame min-h-[30rem] md:h-[40rem] w-full max-w-screen flex flex-col items-center justify-center overflow-hidden rounded-md">
                        <picture>
                            {avatarAvifSrc ? <source srcSet={avatarAvifSrc} type="image/avif" /> : null}
                            {avatarWebpSrc ? <source srcSet={avatarWebpSrc} type="image/webp" /> : null}
                            <img
                                src={avatarSrc}
                                alt="Kevin Turcios"
                                className="hero-avatar w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-zinc-800 mb-4"
                                width={128}
                                height={128}
                                loading="eager"
                                fetchpriority="high"
                                decoding="async"
                            />
                        </picture>
                        <div className="hero-socials flex space-x-6 items-center py-1">
                            <a
                                className="group"
                                href="https://github.com/krrt7"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="GitHub profile"
                            >
                                <IconGithub className="text-white h-10 w-10 md:h-16 md:w-16 transition-opacity hover:opacity-50" />
                            </a>
                            <button className="relative group" id="discord-copy" aria-label="Copy Discord username">
                                <IconDiscord className="text-white h-10 w-10 md:h-16 md:w-16 transition-opacity hover:opacity-50" />
                                <div
                                    className="transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center space-x-1 absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-black border border-zinc-950 text-white text-xs rounded py-1 px-2 z-10 pointer-events-none whitespace-nowrap"
                                    id="discord-tooltip"
                                >
                                    <span id="discord-icon-container" className="discord-icon">
                                        <IconCopy className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 discord-copy-icon" />
                                        <IconCheck className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 discord-check-icon" />
                                    </span>
                                    <span className="text-sm md:text-base lg:text-lg font-medium" id="discord-text">
                                        .krrt
                                    </span>
                                </div>
                            </button>
                            <a className="group" href="mailto:turcioskevinr@gmail.com" aria-label="Send email">
                                <IconEnvelope className="text-white h-10 w-10 md:h-16 md:w-16 transition-opacity hover:opacity-50" />
                            </a>
                        </div>
                        <h1
                            className="hero-title md:text-7xl text-5xl lg:text-9xl font-bold text-center relative z-20 px-4 py-1 rounded-lg"
                            style={{ color: "#fff" }}
                        >
                            Hi, I&apos;m Kevin.
                        </h1>
                        <div className="hero-separator w-[20rem] opacity-0 md:opacity-100 md:w-[40rem] relative">
                            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
                            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
                            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
                        </div>
                        <div className="text-center">
                            <div
                                className="hero-subtitle font-extralight text-2xl md:text-3xl px-3 py-2 rounded-lg"
                                style={{ color: "#f4f4f5" }}
                            >
                                I&apos;m a software engineer from El Salvador, based in Colombia.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
