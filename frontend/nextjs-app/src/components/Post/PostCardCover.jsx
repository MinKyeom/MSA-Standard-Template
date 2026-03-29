"use client";

import { useState } from "react";

/** https URL 또는 동일 출처 상대 경로(/api/...). javascript: 등 차단 */
function resolveMediaSrc(s) {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (t.startsWith("/") && !t.startsWith("//") && !t.includes("..")) {
    return t;
  }
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return t;
  } catch {
    /* ignore */
  }
  return null;
}

export default function PostCardCover({ imageUrl, videoUrl }) {
  const videoSrc = resolveMediaSrc(videoUrl);
  const imageSrc = resolveMediaSrc(imageUrl);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (videoSrc && !videoFailed) {
    return (
      <div className="post-card__media" aria-hidden="true">
        <video
          className="post-card__media-el post-card__media-el--video"
          src={videoSrc}
          muted
          playsInline
          loop
          autoPlay
          preload="metadata"
          onError={() => setVideoFailed(true)}
        />
        <div className="post-card__media-scrim" />
      </div>
    );
  }

  if (imageSrc && !imageFailed) {
    return (
      <div className="post-card__media" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="post-card__media-el"
          src={imageSrc}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
        <div className="post-card__media-scrim" />
      </div>
    );
  }

  return (
    <div className="post-card__media post-card__media--default" aria-hidden="true">
      <span className="post-card__default-title">MinKowskiM</span>
    </div>
  );
}
