import { pagesOutDir, writePagesStaticSite } from "@/site/static-output";

await writePagesStaticSite();

console.log(`Cloudflare Pages output written to ${pagesOutDir}`);
