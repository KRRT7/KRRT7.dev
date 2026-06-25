import type { HomepageContext } from "@/lib/homepage-context";
import { ContributionsSection } from "./contributions";
import { Footer } from "./footer";
import { PersonalProjects } from "./projects";

export function ProjectsSection({
    context,
    contributionDataSrc,
}: {
    context: HomepageContext;
    contributionDataSrc?: string;
}) {
    return (
        <section className="snap-start min-h-screen section-band section-band--emerald bg-gradient-to-b from-emerald-950/10 via-transparent to-transparent">
            <div
                className="content-panel reveal-section"
                style={{ transition: "opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s" }}
            >
                <section id="projects" className="flex flex-col w-full">
                    <PersonalProjects projects={context.projects} />
                    <ContributionsSection context={context} contributionDataSrc={contributionDataSrc} />
                    <Footer currentYear={context.currentYear} />
                </section>
            </div>
        </section>
    );
}
