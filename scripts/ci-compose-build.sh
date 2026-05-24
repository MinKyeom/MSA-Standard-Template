#!/usr/bin/env bash
# CI용 docker compose build — ALL 시 경량 이미지 먼저, Java는 제한 병렬.
# reverse-proxy 등이 Maven 빌드와 동시에 돌며 BuildKit context deadline exceeded 나는 것을 줄입니다.
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

build_one() {
  docker compose --env-file "$ENV_FILE" build "$1"
}

build_batch() {
  local parallel="${1:?parallel count}"
  shift
  docker compose --parallel "$parallel" --env-file "$ENV_FILE" build "$@"
}

if [ ${#REQUESTED[@]} -gt 0 ]; then
  if [ ${#REQUESTED[@]} -eq 1 ]; then
    build_one "${REQUESTED[0]}"
  else
    build_batch 1 "${REQUESTED[@]}"
  fi
  exit 0
fi

echo "::notice:: CI phased ALL build (reverse-proxy first, Java parallel=2, frontend last)"

# 1) nginx — 수 초면 끝. Maven과 동시 빌드하지 않음
build_one reverse-proxy

# 2) 경량 백엔드
build_batch 1 mail-service fastapi-ai

# 3) Java MSA (Maven) — 2개씩
build_batch 2 api-gateway auth-service user-service post-service search-service

# 4) Next.js — npm ci + build (메모리 많이 씀)
build_one frontend
