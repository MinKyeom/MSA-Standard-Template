import Link from "next/link";
import { fetchCsSummary } from "../../services/api/cs";
import { fetchPosts } from "../../services/api/posts";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import CsActions from "./CsActions";
import { getSiteUrl } from "../../config/site";
import "../../styles/globals.css";
import "../../styles/AboutPage.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CS Notes",
  description:
    "면접·정처기·실무 CS 개념을 포스터 형식으로 요약한 MinKowskiM CS Notes 페이지입니다.",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

async function getCsSummary() {
  try {
    return await fetchCsSummary({ cache: "no-store" });
  } catch (error) {
    console.error("CS summary page fetch failed:", error);
    return null;
  }
}

async function getRelatedCsPosts() {
  try {
    const data = await fetchPosts(0, 5, "CS", null, { cache: "no-store" });
    return Array.isArray(data?.content) ? data.content : [];
  } catch (error) {
    console.error("CS related posts fetch failed:", error);
    return [];
  }
}

export default async function CsSummaryPage() {
  const [page, relatedPosts] = await Promise.all([getCsSummary(), getRelatedCsPosts()]);
  const title = page?.title || "CS Notes";
  const content = page?.content || "";
  const canonicalUrl = `${getSiteUrl()}/cs`;

  return (
    <div className="about-page-container">
      <article className="about-page-article">
        <header className="about-page-header">
          <h1 className="about-page-title">{title}</h1>
          {page?.updatedAt && (
            <p className="about-page-meta">Last updated: {formatDate(page.updatedAt)}</p>
          )}
          <CsActions />
        </header>

        <div className="about-page-body">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="about-page-empty">
              CS summary content is not available yet. Administrators can add it from the edit page.
            </p>
          )}
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="cs-related-section" aria-labelledby="cs-related-heading">
          <h2 id="cs-related-heading" className="cs-related-title">
            Related CS posts
          </h2>
          <ul className="cs-related-list">
            {relatedPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/post/${post.id}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
          <p className="cs-related-more">
            <Link href="/post?category=CS">View all CS posts</Link>
          </p>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            url: canonicalUrl,
            description:
              "Computer Science concept summaries for interviews and professional study.",
            isPartOf: {
              "@type": "WebSite",
              name: "MinKowskiM",
              url: getSiteUrl(),
            },
          }),
        }}
      />
    </div>
  );
}
