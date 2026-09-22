import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const STATIC = ["", "how-it-works", "use-cases", "security", "features", "pricing", "apply", "about", "docs", "blog", "privacy", "terms"];

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL("https://zonesteward.com")).toString().replace(/\/$/, "");
  const posts = await getCollection("blog");
  const urls = [
    ...STATIC.map((p) => ({ loc: `${base}/${p}`, mod: null as string | null })),
    ...posts.map((p) => ({ loc: `${base}/blog/${p.id}`, mod: p.data.date.toISOString().slice(0, 10) })),
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ""}</url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
};
