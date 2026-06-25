import { languageBadgeClass } from "@/lib/format";

export function LanguageBadge({ language }: { language: string }) {
    return <span className={`text-xs px-2 py-0.5 rounded-full border ${languageBadgeClass(language)}`}>{language}</span>;
}
