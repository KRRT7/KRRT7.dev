import type { ReactNode } from "react";

export function SiteDocument({ children, scriptSrc = "/site-behavior.js" }: { children?: ReactNode; scriptSrc?: string }) {
    return (
        <html lang="en" className="dark">
            <body className="bg-black text-zinc-300">
                <a
                    href="#about"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-zinc-900 focus:text-white focus:rounded focus:border focus:border-zinc-700"
                >
                    Skip to content
                </a>
                {children}
                <script type="module" src={scriptSrc} async />
            </body>
        </html>
    );
}
