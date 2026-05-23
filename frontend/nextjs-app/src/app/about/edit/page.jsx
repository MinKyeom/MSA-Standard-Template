"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchAboutClient, updateAbout } from "../../../services/api/about";
import { useAuth } from "../../../providers/AuthProvider";
import { useToast } from "../../../hooks/useToast";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "../../../styles/globals.css";

marked.setOptions({
  breaks: true,
});

const renderMarkdown = (markdown) => {
  if (!markdown) return "";
  const rawMarkup = marked.parse(markdown);
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(rawMarkup);
  }
  return rawMarkup;
};

export default function AboutEditPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isAuthInitialized } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (!isAuthInitialized) return;
    if (!isAuthenticated) {
      showToast({ message: "Please log in to continue.", type: "error" });
      router.push("/signin?redirect=/about/edit");
      return;
    }
    if (!isAdmin) {
      showToast({ message: "Only administrators can edit the About page.", type: "error" });
      router.push("/about");
    }
  }, [isAuthInitialized, isAuthenticated, isAdmin, router, showToast]);

  useEffect(() => {
    if (!isAuthInitialized || !isAuthenticated || !isAdmin) return;

    setIsLoading(true);
    fetchAboutClient()
      .then((data) => {
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
      })
      .catch(() => {
        showToast({ message: "Failed to load About page.", type: "error" });
        router.push("/about");
      })
      .finally(() => setIsLoading(false));
  }, [isAuthInitialized, isAuthenticated, isAdmin, router, showToast]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      showToast({ message: "Title and content are required.", type: "error" });
      return;
    }

    setSubmitLoading(true);
    try {
      await updateAbout({ title: title.trim(), content });
      showToast({ message: "About page saved.", type: "success" });
      router.push("/about");
      router.refresh();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save About page.";
      showToast({ message, type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  }, [title, content, router, showToast]);

  if (!isAuthInitialized || isLoading || (isAuthenticated && isAdmin === false)) {
    return (
      <div className="container" style={{ padding: "100px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-main)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container write-page-shell">
      <header style={{ marginBottom: "30px" }}>
        <h1 className="write-page-title">Edit About me</h1>
        <p style={{ color: "var(--color-text-sub)", marginTop: "8px", fontSize: "0.95rem" }}>
          마크다운으로 작성하고 오른쪽에서 미리보기할 수 있습니다. 포스트 작성 화면과 동일한 방식입니다.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "1.2rem",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-text-main)",
          }}
        />

        <div className="write-page-editor-row">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your About page in Markdown..."
            className="write-page-textarea"
          />

          <div
            className="markdown-body preview-area write-page-preview"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>

        <div
          className="form-actions"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <Link
            href="/about"
            className="btn-secondary"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Cancel
          </Link>
          <button
            type="button"
            className="btn-primary"
            disabled={submitLoading || !title.trim() || !content.trim()}
            onClick={handleSave}
          >
            {submitLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
