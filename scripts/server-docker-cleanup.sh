#!/usr/bin/env bash
# 서버 전용: Docker 디스크·빌드 캐시·중지된 리소스 정리 (compose 볼륨/DB 데이터는 기본 유지)
#
# 사용 (프로젝트 루트에서):
#   bash scripts/server-docker-cleanup.sh
#   bash scripts/server-docker-cleanup.sh --down-first   # 먼저 이 프로젝트 스택만 compose down
#   bash scripts/server-docker-cleanup.sh --aggressive  # 미사용 이미지·캐시 전부 (--down-first 와 함께 가능)
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOWN_FIRST=false
AGGRESSIVE=false
for a in "$@"; do
  case "$a" in
    --down-first) DOWN_FIRST=true ;;
    --aggressive) AGGRESSIVE=true ;;
  esac
done

if [[ "$DOWN_FIRST" == true ]] && [[ -f "$ROOT/docker-compose.yml" ]]; then
  if [[ -f "$ROOT/.env" ]]; then
    (cd "$ROOT" && docker compose down)
  else
    echo "[cleanup] .env 없음 — compose down 생략"
  fi
fi

echo "[cleanup] 중지된 컨테이너·dangling 이미지·미사용 네트워크"
docker system prune -f

if [[ "$AGGRESSIVE" == true ]]; then
  echo "[cleanup] 사용 중인 컨테이너가 참조하지 않는 이미지 전부"
  docker image prune -a -f
  echo "[cleanup] BuildKit 빌드 캐시 전부"
  docker builder prune -a -f
else
  docker image prune -f
  docker builder prune -f
fi

echo "[cleanup] 완료 — docker system df"
docker system df
