"use client";

import { useRef, useEffect, useState, useId } from "react";
// public/text.svg (MinKowskiM)에서 M 서브패스로 분리 — 에디터에서 SVG만 갈아끼우려면 동일 규칙으로 JSON 재생성
import TITLE_PATHS from "../../data/textTitlePaths.json";

// 한 루프 전체 길이 (초) – 그리기 후 오래 유지, 부드럽게 페이드 (반복감 완화)
const TOTAL_LOOP = 28;
// 손글씨 느낌: 초반에 빠르고 끝에서 쫀득하게 맺힘
const HANDWRITING_EASING = "cubic-bezier(0.2, 0, 0.2, 1)";
// text.svg viewBox (높이 ≈ 기존의 절반 → 마스크 붓 두께도 비율 맞춤)
const VIEWBOX = "0.01764705777168274 14.699999809265137 217.09161376953125 35.96379089355469";
const DOT_LENGTH_THRESHOLD = 5; // 이 길이 미만이면 점/짧은 획으로 취급
/** text.svg 좌표계에서 기존 6px 붓에 해당하는 두께 (viewBox 높이 비 ≈ 0.49) */
const MASK_STROKE_MAIN = 3;

// path의 시작점 M 명령에서 x 좌표 추출
function getStartX(d) {
  const m = d.match(/M\s*([-\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

/**
 * text.svg 윤곽 path를 두꺼운 붓(mask)으로 사용하여
 * fill이 왼쪽→오른쪽 순으로 써지며 드러나는 효과.
 */
export default function HeroPathTitle({
  stepDelay = 0.4,
  startDelay = 0,
  className = "",
  as: Tag = "h1",
}) {
  const svgRef = useRef(null);
  const maskId = useId().replace(/:/g, "-");
  const [lengths, setLengths] = useState([]);
  const ready = lengths.length === TITLE_PATHS.length;

  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll("path.hero-centerline-path");
    if (!paths.length) return;
    const ls = Array.from(paths).map((p) => p.getTotalLength());
    setLengths(ls);
  }, []);

  return (
    <Tag
      className={`hero-stroke-wrap hero-path-title ${className}`}
      style={{ margin: 0 }}
      aria-hidden="false"
    >
      <svg
        ref={svgRef}
        className="hero-stroke-svg hero-path-svg"
        viewBox={VIEWBOX}
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
              {TITLE_PATHS
                .map((d, index) => ({
                  d,
                  index,
                  startX: getStartX(d),
                }))
                .sort((a, b) => a.startX - b.startX)
                .map(({ d, index }, orderIndex) => {
                const len = lengths[index] || 0;
                const isDotLike = ready && len > 0 && len < DOT_LENGTH_THRESHOLD;
                // 왼쪽→오른쪽 순서로 차례대로: 점도 같은 순서에 맞춰 지연 없이
                const delay = startDelay + orderIndex * stepDelay;
                // 모든 획 동일 duration → i 같은 글자가 늦게 끝나지 않고 순서대로 완성
                const duration = TOTAL_LOOP;

                const strokeWidth = MASK_STROKE_MAIN;

                const animatedStyle =
                  ready && len
                    ? isDotLike
                      ? {
                          animation: `heroDotPressure ${duration}s ${HANDWRITING_EASING} infinite`,
                          animationDelay: `${delay}s`,
                          animationFillMode: "backwards",
                          ["--hero-len"]: len,
                          strokeWidth,
                        }
                      : {
                          animation: `heroStrokeDrawLoop ${duration}s ${HANDWRITING_EASING} infinite`,
                          animationDelay: `${delay}s`,
                          animationFillMode: "backwards",
                          ["--hero-len"]: len,
                          strokeWidth,
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
              })}
            </g>
          </mask>
        </defs>

        {/* 마스크 뒤의 실제 글자 면: 붓이 지나간 부분만 드러남 */}
        <g
          className="hero-path-fill-group"
          style={{
            animation: `heroFillOpacityLoop ${TOTAL_LOOP}s ${HANDWRITING_EASING} infinite`,
            animationDelay: `${startDelay}s`,
            animationFillMode: "backwards",
          }}
        >
          {/* text.svg와 동일 path → 마스크와 1:1 */}
          <g mask={`url(#${maskId})`} fill="currentColor" stroke="none">
            {TITLE_PATHS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
      </svg>
    </Tag>
  );
}

