function strip(s) {
  return (s || "").trim().replace(/\/$/, "");
}

function isDev() {
  return process.env.NODE_ENV === "development";
}

/**
 * docker-compose 기본 게이트웨이 포트. .env 없이 `npm run dev`만 켤 때 SSR 등.
 */
const DEV_GATEWAY = "http://127.0.0.1:8085";

function devFallback() {
  return isDev() ? DEV_GATEWAY : "";
}

/**
 * 브라우저가 localhost / 127.0.0.1 로 열렸는데 NEXT_PUBLIC_* 에 운영 도메인이 박혀 있으면
 * 로그인·챗봇 등이 원격으로 나가 실패함. 이 때는 항상 "지금 접속 중인 호스트:8085" 게이트웨이 사용.
 * localhost 와 127.0.0.1 혼용 시 쿠키 도메인이 갈라지므로 호스트를 맞춤.
 *
 * @param {string} resolvedApiBase - 해당 헬퍼가 쓰는 공개 API 베이스(URL 또는 origin+path 일부)
 * @returns {string|null} 덮어쓸 베이스 또는 null(빌드 값 유지)
 */
function browserLocalGatewayOverride(resolvedApiBase) {
  if (typeof window === "undefined") return null;
  const h = window.location.hostname;
  if (h !== "localhost" && h !== "127.0.0.1") return null;

  const raw = strip(resolvedApiBase);
  if (!raw) {
    return `http://${h}:8085`;
  }
  try {
    const u = new URL(raw.includes("://") ? raw : `http://${raw}`);
    const isLoopbackApi = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (!isLoopbackApi) {
      return `http://${h}:8085`;
    }
    if (u.hostname !== h) {
      return `http://${h}:8085`;
    }
  } catch {
    return `http://${h}:8085`;
  }
  return null;
}

function withBrowserOverride(internal, pub, pickPub) {
  const p = strip(pickPub);
  if (typeof window === "undefined") {
    return internal || p || devFallback();
  }
  const local = browserLocalGatewayOverride(p);
  if (local) return local;
  return p || internal || devFallback();
}

/**
 * 브라우저: NEXT_PUBLIC_* (로컬 호스트 접속 시 운영 URL 자동 보정)
 * Docker 컨테이너 SSR: GATEWAY_INTERNAL_URL (예: http://api-gateway:8085)
 */
export function gatewayBaseUrl() {
  const internal = strip(process.env.GATEWAY_INTERNAL_URL);
  const pub = strip(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_AUTH_API_URL ||
      process.env.NEXT_PUBLIC_POST_API_URL ||
      process.env.NEXT_PUBLIC_USER_API_URL ||
      ""
  );
  return withBrowserOverride(internal, pub, pub);
}

export function postServiceBaseUrl() {
  const internal = strip(process.env.GATEWAY_INTERNAL_URL);
  const pub = strip(process.env.NEXT_PUBLIC_POST_API_URL || process.env.NEXT_PUBLIC_API_URL || "");
  return withBrowserOverride(internal, pub, pub);
}

export function authServiceBaseUrl() {
  const internal = strip(process.env.GATEWAY_INTERNAL_URL);
  const pub = strip(process.env.NEXT_PUBLIC_AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || "");
  return withBrowserOverride(internal, pub, pub);
}

export function userServiceBaseUrl() {
  const internal = strip(process.env.GATEWAY_INTERNAL_URL);
  const pub = strip(process.env.NEXT_PUBLIC_USER_API_URL || process.env.NEXT_PUBLIC_API_URL || "");
  return withBrowserOverride(internal, pub, pub);
}

/** 챗봇 HTTP 엔드포인트 (POST) */
export function chatHttpUrl() {
  const internal = strip(process.env.GATEWAY_INTERNAL_URL);
  if (typeof window === "undefined") {
    if (internal) return `${internal}/chat`;
    const pub = strip(process.env.NEXT_PUBLIC_CHATBOT_API_URL);
    if (pub) return pub.replace(/\/$/, "");
    const g = gatewayBaseUrl();
    return g ? `${g}/chat` : "";
  }
  const explicit = (process.env.NEXT_PUBLIC_CHATBOT_API_URL || "").trim();
  if (explicit) {
    const e = explicit.replace(/\/$/, "");
    const local = browserLocalGatewayOverride(e);
    if (local) return `${local}/chat`;
    return e;
  }
  const g = gatewayBaseUrl();
  return g ? `${g}/chat` : "";
}
