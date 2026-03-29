// src/components/Post/PostCard.jsx
// Server Component: 미디어·요약은 클라이언트 하위 컴포넌트로 분리

import Link from "next/link";
import PostCardCover from "./PostCardCover";
import PostCardExcerpt from "./PostCardExcerpt";
import "../../styles/HomePage.css";

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function PostCard({ post, showViewCount = false }) {
  const content = post.content || "";
  return (
    <Link href={`/post/${post.id}`} className="post-card post-card--feed">
      <PostCardCover imageUrl={post.cardCoverImageUrl} videoUrl={post.cardCoverVideoUrl} />
      <div className="post-card__body">
        <h3 className="post-card__title">{post.title || "제목 없음"}</h3>
        <div className="post-card__excerpt">
          <PostCardExcerpt markdown={content} />
        </div>
        <div className="post-meta">
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
              {post.authorNickname || "Unknown"}
            </span>
            <span style={{ fontSize: "0.9em", color: "var(--color-text-sub)", marginTop: "4px" }}>
              {formatDate(post.createdAt)}
            </span>
          </span>
          <span>
            {showViewCount && (post.viewCount ?? 0) > 0 && (
              <span
                className="view-count-badge"
                style={{ marginRight: "8px", fontSize: "0.85em", color: "var(--color-text-sub)" }}
              >
                조회 {post.viewCount}
              </span>
            )}
            <span
              className="tag-badge"
              style={{ backgroundColor: "var(--color-secondary)", color: "var(--color-accent)" }}
            >
              {post.categoryName || "미분류"}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
