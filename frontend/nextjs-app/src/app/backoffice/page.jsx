"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getMonitorUrl } from "../../config/site";

/**
 * 브라우저 → Next 동일 출처 → 서버에서 게이트웨이로 프록시.
 * CORS·NEXT_PUBLIC_API_URL·Docker 내부 호스트(api-gateway) 불일치로 인한 Failed to fetch 방지.
 */
const GATEWAY_PROXY = "/api/gateway-proxy";

const defaultRows = [
  { id: "gateway", name: "API Gateway", path: "/actuator/health", status: null, message: "" },
  { id: "post", name: "Post 서비스", path: "/api/posts?size=1", status: null, message: "" },
  { id: "search", name: "Search 서비스", path: "/api/search?q=test&limit=2", status: null, message: "" },
  { id: "chat", name: "Chat 서비스", path: "/chat/health", status: null, message: "" },
];

function checkGatewayHealth() {
  return fetch(`${GATEWAY_PROXY}/actuator/health`, { credentials: "omit" })
    .then(async (res) => {
      if (!res.ok) return { status: "DOWN", message: `HTTP ${res.status}` };
      const data = await res.json().catch(() => null);
      const st = data?.status ?? (data ? "UP" : null);
      return { status: st === "UP" || st === "up" ? "UP" : "DOWN", message: st || `HTTP ${res.status}` };
    })
    .catch((e) => ({ status: "DOWN", message: e?.message || "연결 실패" }));
}

function checkPostService() {
  return fetch(`${GATEWAY_PROXY}/api/posts?size=1`, { credentials: "omit" })
    .then((res) =>
      res.ok ? { status: "UP", message: "목록 조회 성공" } : { status: "DOWN", message: `HTTP ${res.status}` }
    )
    .catch((e) => ({ status: "DOWN", message: e?.message || "연결 실패" }));
}

function checkSearchService() {
  return fetch(`${GATEWAY_PROXY}/api/search?q=test&limit=2`, { credentials: "omit" })
    .then((res) =>
      res.ok ? { status: "UP", message: "Search API OK" } : { status: "DOWN", message: `HTTP ${res.status}` }
    )
    .catch((e) => ({ status: "DOWN", message: e?.message || "연결 실패" }));
}

function checkChatService() {
  return fetch(`${GATEWAY_PROXY}/chat/health`, { credentials: "omit" })
    .then(async (res) => {
      if (!res.ok) return { status: "DOWN", message: `HTTP ${res.status}` };
      const data = await res.json().catch(() => null);
      const ok = data?.status === "ok";
      return ok
        ? { status: "UP", message: "챗봇 서비스 정상" }
        : { status: "DOWN", message: data ? JSON.stringify(data).slice(0, 80) : `HTTP ${res.status}` };
    })
    .catch((e) => ({ status: "DOWN", message: e?.message || "연결 실패" }));
}

export default function BackofficePage() {
  const [rows, setRows] = useState(defaultRows);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const monitorUrl = getMonitorUrl();

  const runChecks = () => {
    setLoading(true);

    Promise.all([
      checkGatewayHealth(),
      checkPostService(),
      checkSearchService(),
      checkChatService(),
    ])
      .then(([g, p, s, c]) => {
        setRows([
          { id: "gateway", name: "API Gateway", path: "/actuator/health", status: g?.status ?? null, message: g?.message ?? "" },
          { id: "post", name: "Post 서비스", path: "/api/posts?size=1", status: p?.status ?? null, message: p?.message ?? "" },
          { id: "search", name: "Search 서비스", path: "/api/search?q=test&limit=2", status: s?.status ?? null, message: s?.message ?? "" },
          { id: "chat", name: "Chat 서비스", path: "/chat/health", status: c?.status ?? null, message: c?.message ?? "" },
        ]);
        setLastChecked(new Date().toLocaleTimeString("ko-KR"));
      })
      .catch(() => setRows(defaultRows))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runChecks();
  }, []);

  return (
    <div className="backoffice-page" style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem", color: "var(--color-text-main)" }}>
        관리자 · 모니터링
      </h1>

      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>시스템 동작 상태</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {lastChecked && (
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
                마지막 확인: {lastChecked}
              </span>
            )}
            <button
              type="button"
              className="btn-primary-small"
              onClick={runChecks}
              disabled={loading}
            >
              {loading ? "확인 중…" : "다시 확인"}
            </button>
          </div>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid var(--color-border)",
          }}
        >
          <thead>
            <tr style={{ background: "var(--color-secondary)" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>서비스</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>상태</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: "0.75rem" }}>{r.name}</td>
                <td style={{ padding: "0.75rem" }}>
                  {loading && r.status == null ? (
                    <span style={{ color: "var(--color-text-sub)" }}>확인 중…</span>
                  ) : r.status === "UP" || r.status === "up" ? (
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>정상</span>
                  ) : (
                    <span style={{ color: "var(--color-error)" }}>오류</span>
                  )}
                </td>
                <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
                  {r.message || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-sub)" }}>
          Next 서버가 동일 출처로 받아 게이트웨이에 프록시합니다(CORS 없음). 상세 로그·메트릭은 Grafana(Loki)에서 확인하세요.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>모니터링 링크</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "0.5rem" }}>
            {monitorUrl ? (
              <>
                <a
                  href={`${monitorUrl}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-accent)" }}
                >
                  Grafana 대시보드 (Loki 로그)
                </a>
                <span style={{ marginLeft: "0.5rem", color: "var(--color-text-sub)", fontSize: "0.875rem" }}>
                  — {monitorUrl} (NEXT_PUBLIC_MONITOR_URL)
                </span>
              </>
            ) : (
              <span style={{ color: "var(--color-text-sub)", fontSize: "0.875rem" }}>
                모니터링 URL 미설정 — 빌드 시 NEXT_PUBLIC_MONITOR_URL 을 넣으세요.
              </span>
            )}
          </li>
        </ul>
      </section>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/" style={{ color: "var(--color-accent)" }}>← 목록으로</Link>
      </p>
    </div>
  );
}
