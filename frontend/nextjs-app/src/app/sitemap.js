// Dynamic sitemap for SEO (Next.js App Router)
import { getSiteUrl } from "../config/site";
import { postServiceBaseUrl } from "../config/apiBase";

export default async function sitemap() {
  const BASE = getSiteUrl();
  const apiBase = postServiceBaseUrl() || BASE;
  const staticPages = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/post`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/signin`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  let postUrls = [];
  try {
    const res = await fetch(`${apiBase}/api/posts?page=0&size=500`, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "MSA-Blog-Sitemap/1.0" },
    });
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!res.ok || !ct.includes("application/json")) {
      throw new Error(`unexpected response ${res.status} ${ct}`);
    }
    const data = await res.json();
    const content = data.content || [];
    postUrls = content.map((p) => ({
      url: `${BASE}/post/${p.id}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(p.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (e) {
    console.warn("Sitemap: could not fetch posts", e?.message);
  }

  return [...staticPages, ...postUrls];
}
