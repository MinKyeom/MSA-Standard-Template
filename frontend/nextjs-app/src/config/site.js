/** 빌드 타임에 고정되는 공개 사이트 URL (NEXT_PUBLIC_SITE_URL) */
export function getSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  return raw.replace(/\/$/, "");
}

export function getMonitorUrl() {
  return (process.env.NEXT_PUBLIC_MONITOR_URL || "").trim().replace(/\/$/, "");
}
