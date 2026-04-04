#!/usr/bin/env bash
# GHCR 에서 BEFORE_SHA 태그를 당겨 AFTER_SHA 로 태그 후 푸시(빌드 생략).
# pull 실패 시 해당 서비스만 docker compose build 로 폴백.
#
# 사용: ci-retag-unchanged-images.sh <env-file> <before_sha> <after_sha> [built_svc1 built_svc2 ...]
set -euo pipefail

ENV_FILE="${1:?env file}"
BEFORE_SHA="${2:?before sha}"
AFTER_SHA="${3:?after sha}"
shift 3 || true
BUILT=( "$@" )

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PREFIX=$(grep '^DOCKER_IMAGE_PREFIX=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | tr -d '"' | tr -d "'")

suffix_for() {
  case "$1" in
    api-gateway) echo gateway ;;
    auth-service) echo auth ;;
    user-service) echo user ;;
    post-service) echo post ;;
    mail-service) echo mail ;;
    fastapi-ai) echo ai ;;
    search-service) echo search ;;
    frontend) echo frontend ;;
    reverse-proxy) echo nginx ;;
    *) echo "" ;;
  esac
}

is_built() {
  local s="$1"
  local b
  for b in "${BUILT[@]}"; do
    [ "$b" = "$s" ] && return 0
  done
  return 1
}

ALL_SVCS=(api-gateway auth-service user-service post-service mail-service fastapi-ai search-service frontend reverse-proxy)

for svc in "${ALL_SVCS[@]}"; do
  if is_built "$svc"; then
    continue
  fi
  suf=$(suffix_for "$svc")
  [ -n "$suf" ] || continue
  src="${PREFIX}/${suf}:${BEFORE_SHA}"
  dst="${PREFIX}/${suf}:${AFTER_SHA}"
  if docker pull "$src" 2>/dev/null; then
    docker tag "$src" "$dst"
    docker push "$dst"
  else
    echo "::warning:: $src 없음 → $svc compose 빌드"
    docker compose --env-file "$ENV_FILE" build "$svc"
    docker compose --env-file "$ENV_FILE" push "$svc"
  fi
done
