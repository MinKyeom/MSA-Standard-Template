"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { fetchPosts } from "../../services/api/posts";
import PostCard from "../../components/Post/PostCard";
import "../../styles/StructurePage.css";

const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").hostname;
  } catch {
    return "localhost";
  }
})();

const MONITOR_HOST = (() => {
  const m = (process.env.NEXT_PUBLIC_MONITOR_URL || "").trim();
  if (!m) return "observe (NEXT_PUBLIC_MONITOR_URL)";
  try {
    return new URL(m).hostname;
  } catch {
    return m.replace(/^https?:\/\//, "").split("/")[0] || m;
  }
})();

/** 메인 MSA — Nginx 설정: 저장소 nginx/msa-project */
const APP_NODES = [
  {
    id: "https",
    label: "HTTPS",
    sub: `${SITE_HOST} · www`,
    searchTerms: [{ type: "tag", value: "ssl" }, { type: "tag", value: "https" }],
    searchQuery: "ssl https",
  },
  {
    id: "nginx",
    label: "Nginx",
    sub: "리버스 프록시 · 설정 nginx/msa-project",
    searchTerms: [{ type: "tag", value: "nginx" }, { type: "tag", value: "lightsail" }],
    searchQuery: "nginx lightsail",
  },
  {
    id: "nextjs",
    label: "Next.js",
    sub: "/ → 내부 라우팅",
    searchTerms: [
      { type: "category", value: "frontend" },
      { type: "tag", value: "nextjs" },
      { type: "tag", value: "react" },
      { type: "tag", value: "javascript" },
      { type: "tag", value: "typescript" },
    ],
    searchQuery: "frontend nextjs react javascript typescript",
  },
  {
    id: "gateway",
    label: "Spring Cloud Gateway",
    sub: "msa-gateway · JWT 라우팅",
    searchTerms: [
      { type: "tag", value: "gateway" },
      { type: "tag", value: "spring-cloud" },
      { type: "tag", value: "jwt" },
      { type: "tag", value: "spring" },
    ],
    searchQuery: "gateway spring cloud jwt",
  },
  {
    id: "auth",
    label: "Auth",
    sub: "Spring Boot",
    searchTerms: [
      { type: "tag", value: "auth" },
      { type: "tag", value: "jwt" },
      { type: "tag", value: "oauth2" },
      { type: "tag", value: "security" },
    ],
    searchQuery: "auth spring jwt oauth2 security",
  },
  {
    id: "user",
    label: "User",
    sub: "Spring Boot",
    searchTerms: [
      { type: "tag", value: "user" },
      { type: "tag", value: "spring" },
      { type: "tag", value: "security" },
    ],
    searchQuery: "user spring security roles",
  },
  {
    id: "post",
    label: "Post",
    sub: "Spring Boot",
    searchTerms: [
      { type: "tag", value: "post" },
      { type: "tag", value: "spring" },
      { type: "tag", value: "blog" },
    ],
    searchQuery: "post spring blog",
  },
  {
    id: "search",
    label: "Search",
    sub: "FastAPI · pgvector",
    searchTerms: [
      { type: "tag", value: "search" },
      { type: "tag", value: "fastapi" },
      { type: "tag", value: "pgvector" },
    ],
    searchQuery: "search fastapi pgvector",
  },
  {
    id: "ai",
    label: "FastAPI AI",
    sub: "Groq · Redis",
    searchTerms: [
      { type: "tag", value: "ai" },
      { type: "tag", value: "fastapi" },
      { type: "tag", value: "groq" },
      { type: "tag", value: "redis" },
    ],
    searchQuery: "ai fastapi groq redis",
  },
  {
    id: "mail",
    label: "Mail",
    sub: "SMTP · Kafka",
    searchTerms: [
      { type: "tag", value: "mail" },
      { type: "tag", value: "kafka" },
      { type: "tag", value: "smtp" },
    ],
    searchQuery: "mail kafka smtp",
  },
  {
    id: "db-auth",
    label: "db-auth",
    sub: "PostgreSQL",
    searchTerms: [
      { type: "tag", value: "postgresql" },
      { type: "tag", value: "postgres" },
      { type: "tag", value: "db" },
      { type: "tag", value: "database" },
    ],
    searchQuery: "db postgres postgresql database",
  },
  {
    id: "db-user",
    label: "db-user",
    sub: "PostgreSQL",
    searchTerms: [
      { type: "tag", value: "postgresql" },
      { type: "tag", value: "postgres" },
      { type: "tag", value: "db" },
      { type: "tag", value: "database" },
    ],
    searchQuery: "db postgres postgresql database",
  },
  {
    id: "db-post",
    label: "db-post",
    sub: "PostgreSQL",
    searchTerms: [
      { type: "tag", value: "postgresql" },
      { type: "tag", value: "postgres" },
      { type: "tag", value: "db" },
      { type: "tag", value: "database" },
    ],
    searchQuery: "db postgres postgresql database",
  },
  {
    id: "db-search",
    label: "db-search",
    sub: "pgvector",
    searchTerms: [
      { type: "tag", value: "pgvector" },
      { type: "tag", value: "postgresql" },
      { type: "tag", value: "postgres" },
      { type: "tag", value: "db" },
      { type: "tag", value: "database" },
    ],
    searchQuery: "pgvector db postgres postgresql",
  },
  {
    id: "redis",
    label: "Redis",
    sub: "세션 · 캐시",
    searchTerms: [{ type: "tag", value: "redis" }],
    searchQuery: "redis",
  },
  {
    id: "kafka",
    label: "Kafka",
    sub: "KRaft 브로커",
    searchTerms: [{ type: "tag", value: "kafka" }],
    searchQuery: "kafka",
  },
];

const APP_FLOW_ORDER = [
  "https",
  "nginx",
  "nextjs",
  "gateway",
  "auth",
  "user",
  "post",
  "search",
  "ai",
  "mail",
  "db-auth",
  "db-user",
  "db-post",
  "db-search",
  "redis",
  "kafka",
];

/** 관측 전용 서버 — NEXT_PUBLIC_MONITOR_URL 기준 표시 */
const OBS_NODES = [
  {
    id: "obs-https",
    label: "HTTPS",
    sub: MONITOR_HOST,
    searchTerms: [{ type: "tag", value: "monitoring" }, { type: "tag", value: "ssl" }],
    searchQuery: "monitoring observe",
  },
  {
    id: "obs-nginx",
    label: "Nginx",
    sub: `설정 nginx/${MONITOR_HOST}`,
    searchTerms: [{ type: "tag", value: "nginx" }, { type: "tag", value: "monitoring" }],
    searchQuery: "nginx monitoring",
  },
  {
    id: "obs-grafana",
    label: "Grafana",
    sub: "/ → Grafana 대시보드",
    searchTerms: [{ type: "tag", value: "grafana" }],
    searchQuery: "grafana",
  },
  {
    id: "obs-prometheus",
    label: "Prometheus",
    sub: "/prometheus/ → metrics",
    searchTerms: [{ type: "tag", value: "prometheus" }],
    searchQuery: "prometheus",
  },
  {
    id: "obs-loki",
    label: "Loki",
    sub: "/loki/ → logs · 로그 수집",
    searchTerms: [{ type: "tag", value: "loki" }],
    searchQuery: "loki logs",
  },
];

const OBS_FLOW_ORDER = ["obs-https", "obs-nginx", "obs-grafana", "obs-prometheus", "obs-loki"];

function mergePostsByTermResults(termResults) {
  const byId = new Map();
  for (const post of termResults) {
    const id = post?.id ?? post?.postId;
    if (id != null && !byId.has(id)) byId.set(id, { ...post, id: Number(id) });
  }
  return Array.from(byId.values());
}

function AppArchitectureSvg() {
  const tip = "url(#archArrowTipApp)";
  return (
    <svg className="arch-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker
          id="archArrowTipApp"
          className="arch-arrow-marker"
          viewBox="0 0 10 10"
          refX="7.8"
          refY="5"
          markerWidth="2.4"
          markerHeight="2.4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" className="arch-arrow-head" />
        </marker>
      </defs>
      <line x1="50" y1="8" x2="50" y2="26" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="8" x2="50" y2="26" className="arch-line-flow" />
      <line x1="50" y1="26" x2="24" y2="44" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="26" x2="24" y2="44" className="arch-line-flow" style={{ animationDelay: "0.1s" }} />
      <line x1="50" y1="26" x2="76" y2="44" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="26" x2="76" y2="44" className="arch-line-flow" style={{ animationDelay: "0.2s" }} />
      {[8, 24, 40, 60, 76, 92].map((x, i) => (
        <g key={i}>
          <line x1="76" y1="44" x2={x} y2="64" className="arch-line" markerEnd={tip} />
          <line
            x1="76"
            y1="44"
            x2={x}
            y2="64"
            className="arch-line-flow"
            style={{ animationDelay: `${0.3 + i * 0.05}s` }}
          />
        </g>
      ))}
      {[8, 24, 40, 60, 76, 92].map((x, i) => (
        <g key={`svc-db-${i}`}>
          <line x1={x} y1="64" x2={x} y2="88" className="arch-line" markerEnd={tip} />
          <line
            x1={x}
            y1="64"
            x2={x}
            y2="88"
            className="arch-line-flow arch-line-flow-vert"
            style={{ animationDelay: `${0.65 + i * 0.05}s` }}
          />
        </g>
      ))}
      <line x1="8" y1="64" x2="76" y2="88" className="arch-line arch-line-extra" markerEnd={tip} />
      <line x1="8" y1="64" x2="76" y2="88" className="arch-line-flow" style={{ animationDelay: "0.7s" }} />
      <line x1="8" y1="64" x2="92" y2="88" className="arch-line arch-line-extra" markerEnd={tip} />
      <line x1="8" y1="64" x2="92" y2="88" className="arch-line-flow" style={{ animationDelay: "0.72s" }} />
      <line x1="40" y1="64" x2="92" y2="88" className="arch-line arch-line-extra" markerEnd={tip} />
      <line x1="40" y1="64" x2="92" y2="88" className="arch-line-flow" style={{ animationDelay: "0.74s" }} />
      <line x1="92" y1="88" x2="24" y2="64" className="arch-line arch-line-extra" markerEnd={tip} />
      <line x1="92" y1="88" x2="24" y2="64" className="arch-line-flow" style={{ animationDelay: "0.78s" }} />
      <line x1="92" y1="88" x2="92" y2="64" className="arch-line arch-line-extra" markerEnd={tip} />
      <line
        x1="92"
        y1="88"
        x2="92"
        y2="64"
        className="arch-line-flow arch-line-flow-vert"
        style={{ animationDelay: "0.8s" }}
      />
      <line x1="24" y1="64" x2="76" y2="88" className="arch-line arch-line-extra" markerEnd={tip} />
      <line x1="24" y1="64" x2="76" y2="88" className="arch-line-flow" style={{ animationDelay: "0.73s" }} />
    </svg>
  );
}

function ObsArchitectureSvg() {
  const tip = "url(#archArrowTipObs)";
  return (
    <svg className="arch-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker
          id="archArrowTipObs"
          className="arch-arrow-marker"
          viewBox="0 0 10 10"
          refX="7.8"
          refY="5"
          markerWidth="2.4"
          markerHeight="2.4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 2 L 7 2 L 9 5 L 7 8 L 0 8 z" className="arch-arrow-head" />
        </marker>
      </defs>
      <line x1="50" y1="10" x2="50" y2="34" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="10" x2="50" y2="34" className="arch-line-flow" />
      <line x1="50" y1="34" x2="14" y2="74" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="34" x2="14" y2="74" className="arch-line-flow" style={{ animationDelay: "0.12s" }} />
      <line x1="50" y1="34" x2="50" y2="74" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="34" x2="50" y2="74" className="arch-line-flow arch-line-flow-vert" style={{ animationDelay: "0.2s" }} />
      <line x1="50" y1="34" x2="86" y2="74" className="arch-line" markerEnd={tip} />
      <line x1="50" y1="34" x2="86" y2="74" className="arch-line-flow" style={{ animationDelay: "0.28s" }} />
    </svg>
  );
}

export default function StructurePage() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node);
    setLoading(true);
    setPosts([]);
    try {
      const promises = (node.searchTerms || []).map((term) =>
        fetchPosts(0, 8, term.type === "category" ? term.value : null, term.type === "tag" ? term.value : null)
      );
      if (promises.length === 0) {
        setPosts([]);
        return;
      }
      const results = await Promise.all(promises);
      const items = results.flatMap((r) => {
        const data = r?.content ?? r?.data?.content ?? (Array.isArray(r) ? r : []);
        return Array.isArray(data) ? data : [];
      });
      const merged = mergePostsByTermResults(items);
      setPosts(merged.slice(0, 12));
    } catch (err) {
      console.error("Failed to load posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchHref = selectedNode ? `/search?q=${encodeURIComponent(selectedNode.searchQuery || "")}` : "#";

  const appMap = Object.fromEntries(APP_NODES.map((n) => [n.id, n]));
  const obsMap = Object.fromEntries(OBS_NODES.map((n) => [n.id, n]));

  return (
    <div className="structure-page structure-page--systems arch-page-root">
      <header className="structure-header">
        <h1 className="structure-title">System Structure</h1>
        <p className="structure-description">
          물리적으로 분리된 두 서버입니다. 노드를 클릭하면 관련 포스트 검색으로 이어집니다. 선의 점선 흐름은 데이터·요청 흐름을
          표현합니다.
        </p>
      </header>

      <div className="structure-panels" role="presentation">
        <section className="structure-panel" aria-labelledby="panel-app-title">
          <h2 id="panel-app-title" className="structure-panel__title">
            블로그 · MSA 애플리케이션 서버
          </h2>

          <div className="arch-diagram-wrap">
            <div className="arch-diagram arch-diagram--app" role="img" aria-label="메인 MSA 구조도">
            <AppArchitectureSvg />
            <div className="arch-layer arch-layer-0">
              <ArchNode
                node={appMap.https}
                flowIndex={APP_FLOW_ORDER.indexOf("https")}
                isSelected={selectedNode?.id === "https"}
                onClick={() => handleNodeClick(appMap.https)}
              />
            </div>
            <div className="arch-layer arch-layer-1">
              <ArchNode
                node={appMap.nginx}
                flowIndex={APP_FLOW_ORDER.indexOf("nginx")}
                isSelected={selectedNode?.id === "nginx"}
                onClick={() => handleNodeClick(appMap.nginx)}
              />
            </div>
            <div className="arch-layer arch-layer-2">
              <ArchNode
                node={appMap.nextjs}
                flowIndex={APP_FLOW_ORDER.indexOf("nextjs")}
                isSelected={selectedNode?.id === "nextjs"}
                onClick={() => handleNodeClick(appMap.nextjs)}
              />
              <ArchNode
                node={appMap.gateway}
                flowIndex={APP_FLOW_ORDER.indexOf("gateway")}
                isSelected={selectedNode?.id === "gateway"}
                onClick={() => handleNodeClick(appMap.gateway)}
              />
            </div>
            <div className="arch-layer arch-layer-3">
              {["auth", "user", "post", "search", "ai", "mail"].map((id) => (
                <ArchNode
                  key={id}
                  node={appMap[id]}
                  flowIndex={APP_FLOW_ORDER.indexOf(id)}
                  isSelected={selectedNode?.id === id}
                  onClick={() => handleNodeClick(appMap[id])}
                />
              ))}
            </div>
            <div className="arch-layer arch-layer-4">
              {["db-auth", "db-user", "db-post", "db-search", "redis", "kafka"].map((id) => (
                <ArchNode
                  key={id}
                  node={appMap[id]}
                  flowIndex={APP_FLOW_ORDER.indexOf(id)}
                  isSelected={selectedNode?.id === id}
                  onClick={() => handleNodeClick(appMap[id])}
                />
              ))}
            </div>
            </div>
          </div>
        </section>

        <div className="structure-inter-server" aria-hidden="true">
          <span className="structure-inter-server__line" />
          <span className="structure-inter-server__label">physical split</span>
          <span className="structure-inter-server__line" />
        </div>

        <section className="structure-panel" aria-labelledby="panel-obs-title">
          <h2 id="panel-obs-title" className="structure-panel__title">
            관측 · 모니터링 서버
          </h2>

          <div className="arch-diagram-wrap">
            <div className="arch-diagram arch-diagram--obs" role="img" aria-label="관측 스택 구조도">
            <ObsArchitectureSvg />
            <div className="arch-layer arch-layer-obs-0">
              <ArchNode
                node={obsMap["obs-https"]}
                flowIndex={OBS_FLOW_ORDER.indexOf("obs-https")}
                isSelected={selectedNode?.id === "obs-https"}
                onClick={() => handleNodeClick(obsMap["obs-https"])}
              />
            </div>
            <div className="arch-layer arch-layer-obs-1">
              <ArchNode
                node={obsMap["obs-nginx"]}
                flowIndex={OBS_FLOW_ORDER.indexOf("obs-nginx")}
                isSelected={selectedNode?.id === "obs-nginx"}
                onClick={() => handleNodeClick(obsMap["obs-nginx"])}
              />
            </div>
            <div className="arch-layer arch-layer-obs-2">
              {["obs-grafana", "obs-prometheus", "obs-loki"].map((id) => (
                <ArchNode
                  key={id}
                  node={obsMap[id]}
                  flowIndex={OBS_FLOW_ORDER.indexOf(id)}
                  isSelected={selectedNode?.id === id}
                  onClick={() => handleNodeClick(obsMap[id])}
                />
              ))}
            </div>
            </div>
          </div>
        </section>
      </div>

      {selectedNode && (
        <section className="structure-results" aria-live="polite">
          <h2 className="structure-results__title">Posts related to &ldquo;{selectedNode.label}&rdquo;</h2>
          {loading ? (
            <p className="structure-results__loading">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="structure-results__empty">
              No posts match this area yet.{" "}
              <Link href={searchHref} className="structure-results__link">
                Try search
              </Link>
            </p>
          ) : (
            <div className="structure-results__grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
          <p className="structure-results__more">
            <Link href={searchHref} className="structure-results__link">
              View all in search →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

function ArchNode({ node, flowIndex, isSelected, onClick }) {
  if (!node) return null;
  const delay = flowIndex >= 0 ? flowIndex * 0.45 : 0;
  return (
    <div
      className={`arch-node ${isSelected ? "is-selected" : ""}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${node.label}: ${node.sub || ""}`}
    >
      <div className="arch-node__label">{node.label}</div>
      {node.sub && <div className="arch-node__sub">{node.sub}</div>}
    </div>
  );
}
