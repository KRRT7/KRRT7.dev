import { fmtNumber } from "@/lib/format";
import type { Project } from "@/lib/site-types";
import { IconExternalLink, IconStar } from "./icons";
import { LanguageBadge } from "./language-badge";

export function PersonalProjects({ projects }: { projects: Project[] }) {
    if (projects.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-baseline gap-3 pb-4 flex-wrap">
                <h2 className="text-left text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-zinc-50 to-zinc-500 bg-opacity-50">
                    Projects
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((repo) => (
                    <div
                        className="relative group h-full border border-zinc-900 rounded-lg p-4 flex flex-col gap-2 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-950 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                        key={repo.name}
                    >
                        <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 rounded-lg z-[1]"
                            aria-label={repo.name}
                        />
                        <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-zinc-200 text-sm truncate">{repo.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                                {repo.stars > 0 ? (
                                    <span className="flex items-center gap-1 text-xs text-zinc-300">
                                        <IconStar className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" /> {fmtNumber(repo.stars)}
                                    </span>
                                ) : null}
                                {repo.homepage ? (
                                    <a
                                        href={repo.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative z-[2] text-zinc-300 hover:text-zinc-100 transition-colors"
                                        title="Homepage"
                                        aria-label={`${repo.name} homepage`}
                                    >
                                        <IconExternalLink className="w-3 h-3" />
                                    </a>
                                ) : null}
                            </div>
                        </div>
                        {repo.description ? (
                            <p className="text-xs text-zinc-300 line-clamp-2 flex-1">{repo.description}</p>
                        ) : (
                            <div className="flex-1" />
                        )}
                        {repo.language ? (
                            <div className="mt-auto pt-1">
                                <LanguageBadge language={repo.language} />
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
                <a
                    href="https://github.com/krrt7?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
                >
                    View all on GitHub →
                </a>
            </div>
        </div>
    );
}
