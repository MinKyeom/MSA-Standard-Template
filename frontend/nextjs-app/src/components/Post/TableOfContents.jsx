"use client";

import React from "react";

/**
 * 마크다운 본문에서 ##, ### 헤딩을 파싱해 목차(TOC)를 렌더링합니다.
 * rehype-slug가 부여하는 id와 동일한 slug 생성 (공백→하이픈, 소문자).
 */
function slugify(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "");
}

export default function TableOfContents({ content }) {
  if (!content || typeof content !== "string") return null;

  const lines = content.split("\n");
  const items = [];

  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);
    if (h2) items.push({ level: 2, text: h2[1].trim(), id: slugify(h2[1]) });
    if (h3) items.push({ level: 3, text: h3[1].trim(), id: slugify(h3[1]) });
  }

  if (items.length === 0) return null;

  return (
    <nav className="post-toc" aria-label="목차">
      <h3 style={{ fontSize: "1rem", marginBottom: "10px", color: "var(--color-text-sub)" }}>
        목차
      </h3>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              marginLeft: item.level === 3 ? "1rem" : 0,
              marginBottom: "6px",
              fontSize: item.level === 3 ? "0.9em" : "1em",
            }}
          >
            <a
              href={`#${item.id}`}
              style={{
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
              className="toc-link"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
