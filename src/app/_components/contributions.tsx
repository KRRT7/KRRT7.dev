import { cacheStatus, fmtNumber } from "@/lib/format";
import { monthLabel, type HomepageContext } from "@/lib/homepage-context";
import type { PullRequest } from "@/lib/site-types";
import { ContributionCard } from "./contribution-card";
import { ContributionFilterBar } from "./contribution-filter-bar";

export function ContributionsSection({
    context,
    contributionDataSrc,
}: {
    context: HomepageContext;
    contributionDataSrc?: string;
}) {
    const { contributions, cache, currentDate } = context;
    if (contributions.pullRequests.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex flex-col gap-2 pb-4" id="contributions">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-left text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-zinc-50 to-zinc-500 bg-opacity-50">
                        Contributions
                    </h2>
                    <span className="text-sm text-zinc-300">badges show languages each PR touched</span>
                    <span className="text-xs text-zinc-300 ml-auto">updated {currentDate}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                    <span className="summary-pill">{fmtNumber(contributions.rendered)} recent PRs</span>
                    <span className="summary-pill">{fmtNumber(contributions.languages.length)} languages</span>
                    <span className="summary-pill summary-pill--cache">{cacheStatus(cache)}</span>
                </div>
            </div>
            <ContributionFilterBar languages={contributions.languages} />
            {contributions.groups.map((monthGroup) => (
                <div className="month-group" data-month={monthGroup.month} key={monthGroup.month}>
                    <h3 className="month-title">{monthGroup.month}</h3>
                    <div className="pr-grid">
                        {monthGroup.pullRequests.map((pr) => (
                            <ContributionCard pr={pr} key={`${pr.repositoryName}#${pr.number}`} />
                        ))}
                    </div>
                </div>
            ))}
            <script
                id="contribution-data"
                type="application/json"
                data-src={contributionDataSrc}
                dangerouslySetInnerHTML={{ __html: contributionDataSrc ? "" : serializeContributionData(contributions.allPullRequests) }}
            />
            <div id="pr-empty" className="empty-state" style={{ display: "none" }}>
                <div className="empty-state-card">
                    <p id="pr-empty-message">No contributions match this filter.</p>
                    <button id="pr-empty-reset" className="empty-state-action" type="button">
                        Reset filters
                    </button>
                </div>
            </div>
            <div id="load-more-container" className="load-more-wrap">
                <button id="load-more" className="load-more" type="button">
                    <span>Load 24 more</span>
                </button>
            </div>
        </div>
    );
}

export function serializeContributionData(pullRequests: PullRequest[]) {
    return JSON.stringify(
        pullRequests.map((pr) => [
            pr.repositoryName,
            pr.title,
            pr.createdAt,
            pr.merged,
            pr.isDraft,
            pr.url,
            pr.number,
            pr.languages,
            monthLabel(pr.createdAt),
            pr.state,
        ]),
    ).replace(/</g, "\\u003c");
}
