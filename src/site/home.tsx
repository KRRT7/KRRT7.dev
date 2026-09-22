import { About } from "@/app/_components/about";
import { Hero } from "@/app/_components/hero";
import { BackToTop, NavDots } from "@/app/_components/navigation";
import { ProjectsSection } from "@/app/_components/projects-section";
import type { HomepageContext } from "@/lib/homepage-context";

export function HomePage({
    avatarSrc,
    avatarAvifSrc,
    avatarWebpSrc,
    contributionDataSrc,
    context,
    renderDuration,
}: {
    avatarSrc?: string;
    avatarAvifSrc?: string;
    avatarWebpSrc?: string;
    contributionDataSrc?: string;
    context: HomepageContext;
    renderDuration: string;
}) {
    return (
        <main className="page-shell snap-y snap-proximity overflow-y-scroll h-screen relative" role="main">
            <NavDots />
            <BackToTop />
            <Hero renderDuration={renderDuration} avatarSrc={avatarSrc} avatarAvifSrc={avatarAvifSrc} avatarWebpSrc={avatarWebpSrc} />
            <section className="snap-start section-band section-band--indigo bg-gradient-to-b from-indigo-950/10 via-transparent to-transparent">
                <div
                    className="content-panel reveal-section"
                    style={{ transition: "opacity 0.6s ease-out 0s, transform 0.6s ease-out 0s" }}
                >
                    <About stats={context.stats} />
                </div>
            </section>
            <ProjectsSection context={context} contributionDataSrc={contributionDataSrc} />
        </main>
    );
}
