#!/usr/bin/env bash
# 로컬에서 전체 스택 빌드 + 기동 (Lightsail/CI 용 GHCR 설정과 무관하게 로컬 이미지 사용)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/scripts/init-env.sh"
cd "$ROOT"
# 게이트웨이·DB 등 호스트 포트 노출(프로필 edge 없이 개발) — 운영은 COMPOSE_PROFILES=edge 만 쓰고 이 파일은 쓰지 않음
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml:docker-compose.local.yml}"
export DOCKER_IMAGE_PREFIX="${DOCKER_IMAGE_PREFIX:-local/msa}"
export IMAGE_TAG="${IMAGE_TAG:-latest}"
export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"
echo "[local-up] DOCKER_IMAGE_PREFIX=$DOCKER_IMAGE_PREFIX IMAGE_TAG=$IMAGE_TAG"
COMPOSE=(bash "$ROOT/scripts/compose.sh")
"${COMPOSE[@]}" build --parallel
# 일부 환경에서 `up -d` 가 최상위 docker 로 잘못 전달되어 unknown shorthand flag: 'd' 가 납니다 → --detach 사용
"${COMPOSE[@]}" up --detach --build
echo "[local-up] Gateway http://localhost:8085  Frontend http://localhost:3000"
echo "[local-up] 로그: bash scripts/compose.sh logs -f api-gateway"
