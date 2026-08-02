#!/usr/bin/env bash
# 서버 배포: GHCR에서 이미지만 pull 하고 기동. 절대 로컬 build 하지 않음.
# (pull denied → compose 가 build 로 폴백하면 Lightsail 에서 Maven 이 돌며
#  context deadline exceeded 로 실패하는 것이 반복 원인이었음)
#
# 필요 환경변수:
#   GHCR_TOKEN, GHCR_USER  — ghcr.io docker login
#   COMPOSE_PROFILES       — 기본 edge
# 선택:
#   DOCKER_IMAGE_PREFIX, IMAGE_TAG — export 되어 있으면 compose 가 참조(.env 와 함께)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GHCR_USER="${GHCR_USER:?GHCR_USER required}"
GHCR_TOKEN="${GHCR_TOKEN:?GHCR_TOKEN required}"
export COMPOSE_PROFILES="${COMPOSE_PROFILES:-edge}"

echo "::notice:: GHCR login as ${GHCR_USER}"
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin

echo "::notice:: compose pull (no build) IMAGE_TAG=${IMAGE_TAG:-from-.env}"
if ! docker compose --profile edge pull; then
  echo "::error:: GHCR pull 실패. 패키지가 private 이면 Actions Secret GHCR_PULL_TOKEN(PAT read:packages)을 넣거나, Packages를 Public으로 두세요. 서버에서 이미지를 빌드하지 않습니다."
  exit 1
fi

echo "::notice:: compose up --no-build"
docker compose --profile edge up -d --no-build --pull never --force-recreate --remove-orphans

echo "::notice:: deploy compose up finished"
