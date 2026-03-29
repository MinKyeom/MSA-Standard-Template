"use client";

import { plainTextExcerpt } from "../../utils/markdownToPlainText";

/**
 * Velog 피드처럼: 마크다운이 아닌 동일 크기·톤의 평문 미리보기
 */
export default function PostCardExcerpt({ markdown }) {
  const text = plainTextExcerpt(markdown || "", 200);
  return (
    <p className="post-card__excerpt-text">
      {text || "\u00a0"}
    </p>
  );
}
