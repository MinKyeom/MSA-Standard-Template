"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createPost,
  fetchPostById,
  updatePost,
  createDraftPost,
  updateDraftPost,
  fetchDraftById,
  fetchLatestDraftForPost,
  publishDraftPost,
  uploadPostCoverFile,
} from "../../../services/api/posts";
import { useAuth } from "../../../providers/AuthProvider";
import { useToast } from "../../../hooks/useToast";
import "../../../styles/globals.css";

import { marked } from "marked";
import DOMPurify from "dompurify";

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

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, id: currentUserId, isAdmin, isAuthInitialized } = useAuth();
  const { showToast } = useToast();

  const editId = searchParams.get("id");
  const draftMode = searchParams.get("draft") === "1";
  const isEdit = useMemo(() => !!editId, [editId]);
  const isDraftEditing = isEdit && draftMode;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [cardCoverImageUrl, setCardCoverImageUrl] = useState("");
  const [cardCoverVideoUrl, setCardCoverVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(!!editId);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [checkedLinkedDraft, setCheckedLinkedDraft] = useState(false);
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverVideoUploading, setCoverVideoUploading] = useState(false);

  useEffect(() => {
    setCheckedLinkedDraft(false);
  }, [editId, draftMode]);

  useEffect(() => {
    if (!isAuthInitialized) return;
    if (!isAuthenticated) {
      showToast({ message: "Please log in to continue.", type: "error" });
      router.push("/signin?redirect=/post/new");
      return;
    }
    if (!isAdmin) {
      showToast({ message: "Only administrators can create posts.", type: "error" });
      router.push("/post");
    }
  }, [isAuthInitialized, isAuthenticated, isAdmin, router, showToast]);

  useEffect(() => {
    if (!editId || !isAuthInitialized || !isAuthenticated || !isAdmin) {
      if (!editId) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const loader = isDraftEditing ? fetchDraftById(editId) : fetchPostById(editId);

    loader
      .then((data) => {
        if (String(data.authorId) !== String(currentUserId)) {
          showToast({ message: "You do not have permission to edit this post.", type: "error" });
          router.push("/post");
          return;
        }
        if (!isDraftEditing && data.draft) {
          router.replace(`/post/new?id=${editId}&draft=1`);
          return;
        }
        if (isDraftEditing && !data.draft) {
          router.replace(`/post/new?id=${editId}`);
          return;
        }
        setTitle(data.title ?? "");
        setCategory(data.categoryName || "");
        setTags(data.tagNames ? data.tagNames.join(", ") : "");
        setContent(data.content ?? "");
        setCardCoverImageUrl(data.cardCoverImageUrl ?? "");
        setCardCoverVideoUrl(data.cardCoverVideoUrl ?? "");
      })
      .catch((err) => {
        console.error("데이터 로드 실패:", err);
        showToast({ message: "Failed to load the post.", type: "error" });
        router.push(isDraftEditing ? "/post/drafts" : "/post");
      })
      .finally(() => setIsLoading(false));
  }, [
    editId,
    isAuthInitialized,
    isAuthenticated,
    isAdmin,
    currentUserId,
    isDraftEditing,
    router,
    showToast,
  ]);

  useEffect(() => {
    if (!isEdit || isDraftEditing || !editId || !isAuthenticated || !isAdmin || checkedLinkedDraft) return;
    (async () => {
      try {
        const linkedDraft = await fetchLatestDraftForPost(editId);
        if (linkedDraft && linkedDraft.id) {
          const useDraft = window.confirm(
            "이 글에 기존 임시 저장본이 있습니다. 임시 저장본으로 이동하시겠습니까?\n\n확인: 임시 저장본 열기\n취소: 현재 화면에서 계속 수정 (최신 저장 우선 적용)"
          );
          if (useDraft) {
            router.replace(`/post/new?id=${linkedDraft.id}&draft=1`);
            return;
          }
          showToast({
            message: "현재 편집본으로 업데이트하면 연결된 이전 임시 저장본은 자동 삭제됩니다.",
            type: "info",
          });
        }
      } catch (e) {
        // linked draft 없음 또는 권한 오류 등은 무시하고 기존 편집 계속
      } finally {
        setCheckedLinkedDraft(true);
      }
    })();
  }, [isEdit, isDraftEditing, editId, isAuthenticated, isAdmin, checkedLinkedDraft, router, showToast]);

  const handleCoverImageFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setCoverImageUploading(true);
    try {
      const url = await uploadPostCoverFile(f);
      setCardCoverImageUrl(url);
      showToast({ message: "이미지가 업로드되어 URL 필드에 반영되었습니다.", type: "success" });
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || err.message || "이미지 업로드에 실패했습니다.";
      showToast({ message: msg, type: "error" });
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleCoverVideoFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setCoverVideoUploading(true);
    try {
      const url = await uploadPostCoverFile(f);
      setCardCoverVideoUrl(url);
      showToast({ message: "동영상이 업로드되어 URL 필드에 반영되었습니다.", type: "success" });
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || err.message || "동영상 업로드에 실패했습니다.";
      showToast({ message: msg, type: "error" });
    } finally {
      setCoverVideoUploading(false);
    }
  };

  const buildPayload = useCallback(
    () => ({
      title,
      content,
      categoryName: category || null,
      tagNames: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
      cardCoverImageUrl: cardCoverImageUrl.trim() || null,
      cardCoverVideoUrl: cardCoverVideoUrl.trim() || null,
    }),
    [title, content, category, tags, cardCoverImageUrl, cardCoverVideoUrl]
  );

  const handlePublish = async () => {
    if (!isAuthenticated) {
      showToast({ message: "Your session has expired. Please sign in again.", type: "error" });
      return;
    }
    if (!title.trim() || !content.trim()) {
      showToast({ message: "Title and content are required to publish.", type: "warning" });
      return;
    }

    setSubmitLoading(true);
    const postRequestData = buildPayload();

    try {
      if (isDraftEditing) {
        await updateDraftPost(editId, postRequestData);
        const published = await publishDraftPost(editId);
        showToast({ message: "Post published successfully.", type: "success" });
        await router.push(`/post/${published.id}`);
        router.refresh();
        return;
      }
      if (isEdit) {
        await updatePost(editId, postRequestData);
        showToast({ message: "Post updated successfully.", type: "success" });
      } else {
        await createPost(postRequestData);
        showToast({ message: "Post published successfully.", type: "success" });
      }
      await router.push("/post");
      router.refresh();
    } catch (error) {
      console.error("저장 실패:", error);
      const errorMsg =
        error.response?.status === 403
          ? "Access denied or session expired (403)"
          : "A server error occurred.";
      showToast({ message: errorMsg, type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!isAuthenticated) return;
    setDraftSaving(true);
    const postRequestData = buildPayload();
    if (isEdit && !isDraftEditing) {
      postRequestData.draftSourcePostId = Number(editId);
    }

    try {
      if (isDraftEditing) {
        await updateDraftPost(editId, postRequestData);
        showToast({ message: "Draft saved.", type: "success" });
      } else {
        if (isEdit && !isDraftEditing) {
          try {
            const existing = await fetchLatestDraftForPost(editId);
            if (existing?.id) {
              const ok = window.confirm(
                "이 글에 이전 임시 저장본이 있습니다.\n\n확인: 기존 임시 저장본을 새 내용으로 교체(덮어쓰기)\n취소: 임시 저장 취소"
              );
              if (!ok) return;
            }
          } catch (_) {
            // 기존 임시저장 조회 실패 시에도 저장은 시도 (서버에서 최신 draft를 재사용하도록 구현됨)
          }
        }
        const created = await createDraftPost(postRequestData);
        showToast({ message: "Draft saved.", type: "success" });
        router.replace(`/post/new?id=${created.id}&draft=1`);
      }
    } catch (error) {
      console.error("임시 저장 실패:", error);
      showToast({ message: error.response?.data?.message || "Failed to save draft.", type: "error" });
    } finally {
      setDraftSaving(false);
    }
  };

  if (!isAuthInitialized || isLoading || (isAuthenticated && isAdmin === false)) {
    return (
      <div className="container" style={{ padding: "100px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-main)" }}>Loading...</p>
      </div>
    );
  }

  const cancelHref = isDraftEditing ? "/post/drafts" : isEdit ? `/post/${editId}` : "/post";
  const pageTitle = isDraftEditing ? "Edit draft" : isEdit ? "Edit post" : "New post";

  return (
    <div className="container write-page-shell">
      <header style={{ marginBottom: "30px" }}>
        <h1 className="write-page-title">{pageTitle}</h1>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
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

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            style={{
              flex: 1,
              minWidth: "140px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            style={{
              flex: 2,
              minWidth: "200px",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "0.9rem", color: "var(--color-text-sub)" }}>
            카드 썸네일(선택): <strong>파일 업로드</strong> 또는 직접 <strong>URL</strong> 입력. 업로드 시 Post 서버에 저장되며 아래 필드에
            경로가 채워집니다. 비우면 흰 배경 + MinKowskiM 기본 이미지가 사용됩니다. 동영상이 설정되면 이미지보다 우선합니다. (이미지 최대
            8MB, 동영상 최대 24MB — jpeg/png/gif/webp, mp4/webm)
          </span>
          <div className="write-page-cover-uploads">
            <label className={`write-page-file-label${coverImageUploading ? " is-busy" : ""}`}>
              <span>{coverImageUploading ? "이미지 업로드 중…" : "이미지 파일 선택"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                disabled={coverImageUploading}
                onChange={handleCoverImageFile}
                className="write-page-file-input"
              />
            </label>
            <label className={`write-page-file-label${coverVideoUploading ? " is-busy" : ""}`}>
              <span>{coverVideoUploading ? "동영상 업로드 중…" : "동영상 파일 선택"}</span>
              <input
                type="file"
                accept="video/mp4,video/webm"
                disabled={coverVideoUploading}
                onChange={handleCoverVideoFile}
                className="write-page-file-input"
              />
            </label>
          </div>
          <input
            type="url"
            value={cardCoverImageUrl}
            onChange={(e) => setCardCoverImageUrl(e.target.value)}
            placeholder="이미지 URL 또는 업로드 후 자동 입력된 경로 (/api/posts/media/files/...)"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
          />
          <input
            type="url"
            value={cardCoverVideoUrl}
            onChange={(e) => setCardCoverVideoUrl(e.target.value)}
            placeholder="동영상 URL 또는 업로드 후 자동 입력 (선택)"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
          />
        </div>

        <div className="write-page-editor-row">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content in Markdown..."
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
            href={cancelHref}
            className="btn-secondary"
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Cancel
          </Link>
          <button
            type="button"
            className="btn-secondary"
            disabled={draftSaving}
            onClick={handleSaveDraft}
          >
            {draftSaving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={submitLoading || !title.trim() || !content.trim()}
            onClick={handlePublish}
          >
            {submitLoading
              ? "Saving..."
              : isDraftEditing
                ? "Publish"
                : isEdit
                  ? "Update"
                  : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
