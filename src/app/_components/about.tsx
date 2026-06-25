import { fmtNumber } from "@/lib/format";
import type { HomepageContext } from "@/lib/homepage-context";
import { IconClock, IconCodeCommit, IconStar } from "./icons";

function StatisticsCard({ stats }: Pick<HomepageContext, "stats">) {
    return (
        <div className="inter-var" id="statistics-card">
            <div className="py-20 flex items-center justify-center" style={{ perspective: "1000px" }}>
                <div
                    id="card-3d-container"
                    className="flex items-center justify-center relative transition-all duration-200 ease-linear"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <div className="bg-transparent relative isolate group/card dark:hover:shadow-2xl dark:hover:shadow-blue-500/[0.1] dark:bg-transparent border-zinc-900 w-full sm:max-w-lg rounded-xl border overflow-hidden [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]">
                        <div id="sparkles-canvas" className="absolute inset-0 z-0 pointer-events-none" />
                        <div className="relative z-10 p-8 md:p-10">
                            <div className="w-fit rounded-lg border border-white/10 bg-zinc-950/45 px-3 py-1.5 text-4xl font-bold text-neutral-600 shadow-[0_0_24px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-200 ease-linear dark:text-white">
                                Statistics
                            </div>
                            <div className="w-fit transition duration-200 ease-linear text-white text-2xl max-w-md mt-5">
                                <div className="flex items-center gap-3">
                                    <IconStar className="w-10 h-10 text-yellow-500" />
                                    <p className="text-zinc-300">{fmtNumber(stats.totalStars)} GitHub Stars</p>
                                </div>
                            </div>
                            <div className="w-fit transition duration-200 ease-linear text-white text-2xl max-w-md mt-4">
                                <div className="flex items-center gap-3">
                                    <IconCodeCommit className="w-10 h-10 text-emerald-500" />
                                    <p className="text-zinc-300">{fmtNumber(stats.totalCommits)} Recent Contributions</p>
                                </div>
                            </div>
                            <div className="w-fit transition duration-200 ease-linear text-white text-2xl max-w-md mt-4">
                                <div className="flex items-center gap-3">
                                    <IconClock className="w-8 h-8" />
                                    <p className="text-zinc-300">
                                        It&apos;s <span id="clock-display">???</span> my time
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function About({ stats }: Pick<HomepageContext, "stats">) {
    return (
        <section className="flex lg:flex-row flex-col items-center justify-center w-full gap-8 lg:gap-16" id="about">
            <div className="flex flex-col items-center text-center">
                <div className="flex flex-col items-center">
                    <p className="font-extralight text-2xl md:text-4xl dark:text-neutral-200 py-4 max-w-3xl">
                        Focused on <span className="font-bold text-white">Human-Centered Computing</span> - building
                        technology that adapts to people, not the other way around.
                    </p>
                    <p className="font-extralight text-2xl md:text-4xl dark:text-neutral-200 py-4 max-w-3xl">
                        In practice: <span className="font-bold text-white">developer tools</span> and{" "}
                        <span className="font-bold text-white">high-performance software</span> that get out of your way
                        and help you ship.
                    </p>
                </div>
            </div>
            <StatisticsCard stats={stats} />
        </section>
    );
}
