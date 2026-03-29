#!/usr/bin/env bash
# 프로젝트 루트에 .env 가 없으면 .env.example 을 복사합니다.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "[init-env] .env 를 새로 만들었습니다 (.env.example 복사)."
  echo "[init-env] JWT_SECRET, POSTGRES_PASSWORD, GROQ_API_KEY 등 필요한 값을 수정하세요."
else
  echo "[init-env] .env 가 이미 있습니다. 건너뜁니다."
fi

NEXT="$ROOT/frontend/nextjs-app"
if [[ -f "$NEXT/.env.production.example" && ! -f "$NEXT/.env.production" ]]; then
  cp "$NEXT/.env.production.example" "$NEXT/.env.production"
  echo "[init-env] $NEXT/.env.production 을 예시에서 생성했습니다(로컬 next build 시)."
fi
