import { fetchAbout } from "../../services/api/about";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import AboutActions from "./AboutActions";
import { getSiteUrl } from "../../config/site";
import "../../styles/globals.css";
import "../../styles/AboutPage.css";

export const metadata = {
  title: "About me",
  description:
    "MinKowskiM 소개 — 백엔드, 프론트엔드, AI/ML과 MSA 블로그를 운영하는 개발자입니다.",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

async function getAbout() {
  try {
    return await fetchAbout();
  } catch (error) {
    console.error("About page fetch failed:", error);
    return null;
  }
}

export default async function AboutPage() {
  const about = await getAbout();
  const title = about?.title || "About me";
  const content = about?.content || "";
  const canonicalUrl = `${getSiteUrl()}/about`;

  return (
    <div className="about-page-container">
      <article className="about-page-article">
        <header className="about-page-header">
          <h1 className="about-page-title">{title}</h1>
          {about?.updatedAt && (
            <p className="about-page-meta">Last updated: {formatDate(about.updatedAt)}</p>
          )}
          <AboutActions />
        </header>

        <div className="about-page-body">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="about-page-empty">
              About content is not available yet. Administrators can add it from the edit page.
            </p>
          )}
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            name: title,
            url: canonicalUrl,
            mainEntity: {
              "@type": "Person",
              name: "MinKowskiM",
              url: getSiteUrl(),
            },
          }),
        }}
      />
    </div>
  );
}
