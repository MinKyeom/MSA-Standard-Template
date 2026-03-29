import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 백오피스 헬스 체크용만 허용 (전체 게이트웨이 오픈 프록시 방지) */
const ALLOWED = [/^actuator\/health$/, /^api\/posts$/, /^api\/search$/, /^chat\/health$/];

function upstreamBase() {
  const raw =
    (process.env.GATEWAY_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8085").trim();
  return raw.replace(/\/$/, "");
}

function joinedPath(segments) {
  if (!segments?.length) return "";
  return segments.filter(Boolean).join("/");
}

export async function GET(request, { params }) {
  const path = joinedPath(params?.path);
  if (!path || !ALLOWED.some((re) => re.test(path))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const base = upstreamBase();
  const url = new URL(request.url);
  const target = `${base}/${path}${url.search}`;

  try {
    const res = await fetch(target, {
      cache: "no-store",
      headers: {
        Accept: request.headers.get("accept") || "application/json",
      },
    });
    const ct = res.headers.get("content-type") || "application/json";
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: res.status,
      headers: { "Content-Type": ct },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "upstream_failed", message: e?.message || "fetch failed" },
      { status: 502 }
    );
  }
}
