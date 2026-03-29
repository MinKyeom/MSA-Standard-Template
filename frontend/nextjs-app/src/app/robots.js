// robots.txt for SEO (Next.js App Router)
import { getSiteUrl } from "../config/site";

export default function robots() {
  const BASE = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/backoffice", "/api/"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/backoffice", "/api/"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
