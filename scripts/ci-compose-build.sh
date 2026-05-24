#!/usr/bin/env bash
# CI용 docker compose build+push — 서비스별 순차 처리.
# compose push 일괄 실행 시 GHCR "unknown blob" / BuildKit 레이어 불일치가 발생할 수 있어
# build --push 를 한 서비스씩, 실패 시 재시도합니다.
#
# 사용:
#   ci-compose-build.sh <env-file>                    # ALL (edge 프로필 서비스 포함)
#   ci-compose-build.sh <env-file> user-service frontend
set -euo pipefail

ENV_FILE="${1:?env file}"
shift || true
REQUESTED=( "$@" )

export COMPOSE_PROFILES="${COMPOSE_PROFILES:-edge}"
export COMPOSE_BAKE="${COMPOSE_BAKE:-false}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ALL_ORDER=(
  reverse-proxy
  mail-service
  fastapi-ai
  api-gateway
  auth-service
  user-service
  post-service
  search-service
  frontend
)

build_push_one() {
  local svc="$1"
  local attempt max=3 delay=15
  for attempt in $(seq 1 "$max"); do
    echo "::notice:: build+push ${svc} (attempt ${attempt}/${max})"
    if docker compose --env-file "$ENV_FILE" build --push "$svc"; then
      return 0
    fi
    if [ "$attempt" -lt "$max" ]; then
      echo "::warning:: build+push ${svc} failed — retry in ${delay}s"
      sleep "$delay"
    fi
  done
  echo "::error:: build+push ${svc} failed after ${max} attempts"
  return 1
}

if [ ${#REQUESTED[@]} -gt 0 ]; then
  for svc in "${REQUESTED[@]}"; do
    build_push_one "$svc"
  done
  exit 0
fi

echo "::notice:: CI sequential ALL build+push (${#ALL_ORDER[@]} services)"
for svc in "${ALL_ORDER[@]}"; do
  build_push_one "$svc"
done
