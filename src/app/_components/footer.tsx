import { IconCopyright } from "./icons";
import type { HomepageContext } from "@/lib/homepage-context";

export function Footer({ currentYear }: Pick<HomepageContext, "currentYear">) {
    return (
        <div className="site-footer flex items-center justify-center flex-col text-zinc-300 py-8">
            <IconCopyright className="w-4 h-4" />
            <p>Kevin Turcios {currentYear}</p>
        </div>
    );
}
