"use client";

import { useRef, useEffect, useState, useId, useMemo } from "react";

const TOTAL_LOOP = 28;
const HANDWRITING_EASING = "cubic-bezier(0.2, 0, 0.2, 1)";
const DOT_LENGTH_THRESHOLD = 5;

function getStartX(d) {
  const m = d.match(/M\s*([-\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * 단일 라인 SVG path로 필기 드로잉 효과.
 * - paths: 로고 등 분리된 획 배열(왼→오 정렬 후 순서 애니메이션)
 * - pathsByChar: 문장용, 글자 인덱스마다 path 또는 null(공백)
 */
export default function HeroPathWrite({
  viewBox,
  paths,
  pathsByChar,
  stepDelay = 0.4,
  startDelay = 0,
  className = "",
  as: Tag = "h1",
  maskStrokeWidth = 3,
}) {
  const svgRef = useRef(null);
  const maskId = useId().replace(/:/g, "-");
  const [lengths, setLengths] = useState([]);

  const mode = pathsByChar != null ? "byChar" : "paths";
  const pathCount = useMemo(() => {
    if (mode === "byChar") return pathsByChar.filter((c) => c?.d).length;
    return (paths ?? []).length;
  }, [mode, paths, pathsByChar]);

  const ready = lengths.length === pathCount && pathCount > 0;

  useEffect(() => {
    if (!svgRef.current) return;
    const els = svgRef.current.querySelectorAll("path.hero-centerline-path");
    if (!els.length) return;
    setLengths(Array.from(els).map((p) => p.getTotalLength()));
  }, [pathCount, mode]);

  const sortedTitle =
    mode === "paths"
      ? (paths ?? [])
          .map((d, index) => ({ d, index, startX: getStartX(d) }))
          .sort((a, b) => a.startX - b.startX)
      : null;

  const renderMaskStroke = (d, index, orderIndex, charIndexForDelay) => {
    const len = lengths[orderIndex] || 0;
    const delay = startDelay + charIndexForDelay * stepDelay;
    const isDotLike = ready && len > 0 && len < DOT_LENGTH_THRESHOLD;
    const duration = TOTAL_LOOP;
    const animatedStyle =
      ready && len
        ? isDotLike
          ? {
              animation: `heroDotPressure ${duration}s ${HANDWRITING_EASING} infinite`,
              animationDelay: `${delay}s`,
              animationFillMode: "backwards",
              ["--hero-len"]: len,
              strokeWidth: maskStrokeWidth,
            }
          : {
              animation: `heroStrokeDrawLoop ${duration}s ${HANDWRITING_EASING} infinite`,
              animationDelay: `${delay}s`,
              animationFillMode: "backwards",
              ["--hero-len"]: len,
              strokeWidth: maskStrokeWidth,
            }
        : {};

    return (
      <path
        key={index}
        className="hero-centerline-path"
        d={d}
        strokeDasharray={ready && !isDotLike ? len : 1000}
        strokeDashoffset={ready && !isDotLike ? len : 1000}
        style={animatedStyle}
      />
    );
  };

  return (
    <Tag
      className={`hero-stroke-wrap hero-path-write ${className}`}
      style={{ margin: 0 }}
      aria-hidden="false"
    >
      <svg
        ref={svgRef}
        className="hero-stroke-svg hero-path-svg"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <g
              className="hero-path-mask-group"
              fill="none"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mode === "paths"
                ? sortedTitle.map(({ d, index }, orderIndex) =>
                    renderMaskStroke(d, index, orderIndex, orderIndex)
                  )
                : pathsByChar.map((cell, charIndex) => {
                    if (!cell?.d) return null;
                    const orderInPaths = pathsByChar
                      .slice(0, charIndex)
                      .filter((c) => c?.d).length;
                    return renderMaskStroke(
                      cell.d,
                      `c-${charIndex}`,
                      orderInPaths,
                      charIndex
                    );
                  })}
            </g>
          </mask>
        </defs>

        <g
          className="hero-path-fill-group"
          style={{
            animation: `heroFillOpacityLoop ${TOTAL_LOOP}s ${HANDWRITING_EASING} infinite`,
            animationDelay: `${startDelay}s`,
            animationFillMode: "backwards",
          }}
        >
          <g mask={`url(#${maskId})`} fill="currentColor" stroke="none">
            {mode === "paths"
              ? (paths ?? []).map((d, i) => <path key={i} d={d} />)
              : pathsByChar.map((cell, i) =>
                  cell?.d ? <path key={i} d={cell.d} /> : null
                )}
          </g>
        </g>
      </svg>
    </Tag>
  );
}
