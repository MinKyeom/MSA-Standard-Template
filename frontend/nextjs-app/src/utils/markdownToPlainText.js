/**
 * 피드 카드용: 마크다운 소스 → 읽기용 평문 (기호·블록 제거, Velog 미리보기에 가깝게)
 */
export function markdownToPlainText(md) {
  if (!md || typeof md !== "string") return "";
  let s = md;

  s = s.replace(/```[\w]*\n?[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1 ");
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/__([^_]+)__/g, "$1");
  s = s.replace(/~~([^~]+)~~/g, "$1");
  s = s.replace(/^>\s?/gm, "");
  s = s.replace(/^[\t ]*[-*+]\s+/gm, "");
  s = s.replace(/^[\t ]*\d+\.\s+/gm, "");
  s = s.replace(/^[-*_]{3,}\s*$/gm, "");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** 카드 한 줄·줄 수에 맞게 짧게 */
export function plainTextExcerpt(md, maxChars = 200) {
  const plain = markdownToPlainText(md);
  if (plain.length <= maxChars) return plain;
  const cut = plain.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
