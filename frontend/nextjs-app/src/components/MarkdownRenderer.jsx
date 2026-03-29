// src/components/MarkdownRenderer.jsx
"use client"; 

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// react-syntax-highlighter 는 GitHub Actions(Webpack) 빌드에서 module-not-found 가 간헐 발생 → 제거, CSS로 블록 스타일

/** 목차 링크용 헤딩 id 생성 (TableOfContents와 동일 규칙) */
function slugify(text) {
  if (text == null) return '';
  return String(text).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\uac00-\ud7a3-]/g, '');
}

function headingText(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(headingText).join('');
  if (children?.props?.children != null) return headingText(children.props.children);
  return '';
}

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ node, children, ...props }) => (
            <h1 className="markdown-h1" id={slugify(headingText(children)) || undefined} {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="markdown-h2" id={slugify(headingText(children)) || undefined} {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="markdown-h3" id={slugify(headingText(children)) || undefined} {...props}>{children}</h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4 className="markdown-h4" id={slugify(headingText(children)) || undefined} {...props}>{children}</h4>
          ),

          // 인용구 스타일을 위해 클래스 적용 (globals.css에 정의)
          blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          
          // ⭐ 3. 코드 블록 (```) 및 인라인 코드 (`) 렌더링 재정의
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');

            // 3-1. 인라인 코드: `code`
            if (inline) {
              return <code className="markdown-inline-code" {...props}>{children}</code>;
            }
            
            // 3-2. 펜스 코드 블록 (구문 색상 없음 · globals.css 의 .markdown-fenced 로 스타일)
            const body = String(children).replace(/\n$/, '');
            return match ? (
              <pre className="markdown-fenced" data-lang={match[1]}>
                <code className={className || undefined} {...props}>
                  {body}
                </code>
              </pre>
            ) : (
              <pre className="markdown-fenced markdown-fenced--plain">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;