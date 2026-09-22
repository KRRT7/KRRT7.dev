import { timeAgo } from "@/lib/format";
import type { PullRequest } from "@/lib/site-types";
import { IconClock, IconGitMerge, IconGitPullRequest } from "./icons";
import { LanguageBadge } from "./language-badge";

export function ContributionCard({ pr }: { pr: PullRequest }) {
    return (
        <div
            className="pr-card"
            data-key={`${pr.repositoryName}#${pr.number}`}
            data-search={`${pr.repositoryName} ${pr.title}`.toLowerCase()}
            data-merged={String(pr.merged)}
            data-state={pr.state}
            data-draft={String(pr.isDraft)}
            data-langs={pr.languages.join(",")}
        >
            <a href={pr.url} target="_blank" rel="noopener noreferrer" className="pr-card-link">
                <div className="pr-card-inner">
                    <div className="pr-card-head">
                        <div className="pr-card-repo">
                            {pr.repositoryName.startsWith("python/") ? (
                                <span className="python-project-mark" aria-hidden="true">
                                    Py
                                </span>
                            ) : null}
                            <p>{pr.repositoryName}</p>
                        </div>
                        <div className="pr-card-meta">
                            {pr.languages.map((language) => (
                                <LanguageBadge language={language} key={language} />
                            ))}
                            <span className="pr-time">
                                <IconClock className="w-4 h-4" /> {timeAgo(pr.createdAt)}
                            </span>
                        </div>
                    </div>
                    <div className="pr-card-body">
                        <div className="pr-card-icon">
                            {pr.merged ? (
                                <IconGitMerge className="text-violet-500 w-7 h-7" />
                            ) : pr.state === "CLOSED" ? (
                                <IconGitPullRequest className="text-rose-500 w-6 h-6" />
                            ) : (
                                <>
                                    <IconGitPullRequest className="text-emerald-500 w-6 h-6" />
                                    {pr.isDraft ? <span className="draft-badge">Draft</span> : null}
                                </>
                            )}
                        </div>
                        <p className="pr-card-title">{pr.title}</p>
                    </div>
                </div>
            </a>
        </div>
    );
}
