export const siteUrl = Bun.env.SITE_URL ?? "https://krrt7-dev.pages.dev";
export const siteTitle = "Kevin Turcios - krrt7";
export const siteDescription = "Kevin Turcios (KRRT7) - open-source infrastructure, developer tooling, and Human-Centered Computing.";
export const siteSocialDescription = "Open-source infrastructure, developer tooling, and Human-Centered Computing.";
export const siteThemeColor = "#09090b";

export function absoluteSiteUrl(path = "/") {
    return new URL(path, siteUrl).toString();
}
