"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../providers/AuthProvider";
import { fetchMyDrafts } from "../../../services/api/posts";
import { useToast } from "../../../hooks/useToast";
import "../../../styles/globals.css";

export default function DraftsPage() {
  const { isAuthenticated, isAuthInitialized, isAdmin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!isAuthInitialized) return;
    if (!isAuthenticated) {
      router.replace("/signin?redirect=/post/drafts");
      return;
    }
    if (!isAdmin) {
      setDrafts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchMyDrafts(page, 20);
        if (cancelled) return;
        const content = data?.content ?? data?.data?.content ?? [];
        setDrafts(Array.isArray(content) ? content : []);
        setTotalPages(data?.totalPages ?? 0);
      } catch (e) {
        if (!cancelled) {
          showToast({ message: "Failed to load drafts.", type: "error" });
          setDrafts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthInitialized, isAuthenticated, isAdmin, page, router, showToast]);

  if (!isAuthInitialized) {
    return (
      <div className="container" style={{ padding: "80px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-main)" }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container" style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "var(--color-text-main)", marginBottom: "8px" }}>Drafts</h1>
      <p style={{ color: "var(--color-text-sub)", marginBottom: "28px" }}>
        임시 저장된 글만 표시됩니다. 공개 목록에는 나타나지 않습니다.
      </p>

      {!isAdmin ? (
        <p style={{ color: "var(--color-text-sub)" }}>
          포스트 임시 저장은 관리자 계정에서만 사용할 수 있습니다.
        </p>
      ) : loading ? (
        <p style={{ color: "var(--color-text-sub)" }}>Loading…</p>
      ) : drafts.length === 0 ? (
        <p style={{ color: "var(--color-text-sub)" }}>임시 저장된 글이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          {drafts.map((d) => (
            <li
              key={d.id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                padding: "16px 20px",
                background: "var(--color-primary)",
              }}
            >
              <Link
                href={`/post/new?id=${d.id}&draft=1`}
                style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: "1.1rem" }}
              >
                {d.title?.trim() ? d.title : "(제목 없음)"}
              </Link>
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--color-text-sub)" }}>
                {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && totalPages > 1 && (
        <div style={{ marginTop: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            className="btn-secondary-small"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span style={{ color: "var(--color-text-sub)", fontSize: "0.9rem" }}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary-small"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <p style={{ marginTop: "32px" }}>
        <Link href="/post/new" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
          New post
        </Link>
      </p>
    </div>
  );
}
