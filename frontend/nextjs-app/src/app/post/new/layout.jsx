/** 서버 세그먼트: 클라이언트 page 의 marked/DOMPurify 가 prerender 시 깨지지 않도록 동적 렌더만 사용 */
export const dynamic = "force-dynamic";

export default function PostNewLayout({ children }) {
  return children;
}
