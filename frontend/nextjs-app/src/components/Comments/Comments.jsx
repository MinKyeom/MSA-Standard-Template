// src/components/Comments/Comments.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  fetchCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
} from "../../services/api/comments";
import { useAuth } from "../../providers/AuthProvider";
import { useToast } from "../../hooks/useToast";
import "../../styles/globals.css";
import "./Comments.css";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function buildCommentTree(comments) {
  const map = new Map();
  (comments || []).forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots = [];
  (comments || []).forEach((c) => {
    const node = map.get(c.id);
    const pid = c.parentCommentId;
    if (pid != null && map.has(pid)) {
      map.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

const CommentForm = ({ postId, onCommentCreated }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast({ message: "Please enter your comment.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const newComment = await createComment(postId, { content });
      onCommentCreated(newComment);
      setContent("");
      showToast({ message: "Comment posted.", type: "success" });
    } catch (error) {
      showToast({ message: error.message || "Failed to post comment.", type: "error" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={4}
        disabled={loading}
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  );
};

const ReplyForm = ({ postId, parentCommentId, onDone, onCancel }) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast({ message: "Please enter your reply.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const newComment = await createComment(postId, {
        content: content.trim(),
        parentCommentId,
      });
      onDone(newComment);
      setContent("");
    } catch (error) {
      showToast({ message: error.message || "Failed to post reply.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="comment-reply-form" onSubmit={handleSubmit}>
      <textarea
        placeholder="Write a reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={loading}
        required
      />
      <div className="comment-reply-form__actions">
        <button type="button" className="btn-secondary-small" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary-small" disabled={loading}>
          {loading ? "Posting..." : "Reply"}
        </button>
      </div>
    </form>
  );
};

const CommentBranch = ({
  node,
  postId,
  currentUserId,
  onDelete,
  onUpdate,
  onThreadChanged,
  depth,
}) => {
  const isAuthor = currentUserId && String(currentUserId) === String(node.authorId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [loading, setLoading] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setEditContent(node.content);
  }, [node.content]);

  const handleUpdate = async () => {
    if (editContent.trim() === node.content) {
      showToast({ message: "No changes to save.", type: "info" });
      setIsEditing(false);
      return;
    }
    if (!editContent.trim()) {
      showToast({ message: "Please enter content.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      await onUpdate(node.id, editContent);
      showToast({ message: "Comment updated.", type: "success" });
      setIsEditing(false);
    } catch (error) {
      showToast({ message: error.message || "Failed to update comment.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this comment?")) {
      onDelete(node.id);
    }
  };

  const afterReply = () => {
    setShowReply(false);
    onThreadChanged();
  };

  return (
    <div className={`comment-item comment-item--depth-${Math.min(depth, 4)}`}>
      <div className="comment-meta">
        <div>
          <span className="comment-author">{node.authorNickname || "Unknown"}</span>
          {isAuthor && <span className="comment-badge"> (you)</span>}
        </div>
        <span className="comment-date">{formatDate(node.createdAt)}</span>
      </div>

      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            disabled={loading}
            className="post-form-textarea"
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-secondary-small"
              onClick={() => {
                setEditContent(node.content);
                setIsEditing(false);
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary-small" onClick={handleUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-content">{node.content}</p>
      )}

      {!isEditing && (
        <div className="comment-actions">
          {currentUserId && (
            <button type="button" className="btn-link-primary" onClick={() => setShowReply((s) => !s)}>
              {showReply ? "Cancel reply" : "Reply"}
            </button>
          )}
          {isAuthor && (
            <>
              <button type="button" className="btn-link-primary" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button type="button" className="btn-link-primary" onClick={handleDelete} style={{ color: "#E53935" }}>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {showReply && currentUserId && (
        <div className="comment-reply-wrap">
          <ReplyForm
            postId={postId}
            parentCommentId={node.id}
            onDone={afterReply}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {node.replies?.length > 0 && (
        <div className="comment-replies">
          {node.replies.map((child) => (
            <CommentBranch
              key={child.id}
              node={child}
              postId={postId}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onThreadChanged={onThreadChanged}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id: currentUserId } = useAuth();
  const { showToast } = useToast();

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommentsByPostId(postId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast({ message: "Failed to load comments.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [postId, showToast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const handleCommentCreated = () => {
    loadComments();
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      await loadComments();
      showToast({ message: "Comment deleted.", type: "success" });
    } catch (error) {
      showToast({ message: error.message || "Failed to delete comment.", type: "error" });
      console.error(error);
    }
  };

  const handleCommentUpdated = async (commentId, editContent) => {
    const updatedComment = await updateComment(commentId, { content: editContent });
    setComments((prev) => prev.map((c) => (c.id === updatedComment.id ? updatedComment : c)));
  };

  return (
    <div className="comments-section">
      <h2 className="section-title">Comments ({comments.length})</h2>

      {currentUserId ? (
        <CommentForm postId={postId} onCommentCreated={handleCommentCreated} />
      ) : (
        <p className="login-prompt">
          <Link href="/signin" className="btn-link-primary">
            Sign in
          </Link>{" "}
          to leave a comment or reply.
        </p>
      )}

      <div className="comments-list">
        {loading ? (
          <p className="loading-message" style={{ textAlign: "center", padding: "30px 0" }}>
            Loading comments...
          </p>
        ) : tree.length > 0 ? (
          tree.map((node) => (
            <CommentBranch
              key={node.id}
              node={node}
              postId={postId}
              currentUserId={currentUserId}
              onDelete={handleDelete}
              onUpdate={handleCommentUpdated}
              onThreadChanged={loadComments}
              depth={0}
            />
          ))
        ) : (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
