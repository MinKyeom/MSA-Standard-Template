#!/usr/bin/env bash
# 공식 Compose V2: "docker compose" (뮬자 사이 공백, 하이픈 없음)
# 구버전 docker-compose(하이픈)는 지원하지 않습니다.
set -euo pipefail

if ! docker info >/dev/null 2>&1; then
  echo "[compose] Docker 데몬에 연결할 수 없습니다 (/var/run/docker.sock 등)." >&2
  echo "[compose] → Docker Desktop 앱을 실행하거나, Colima 사용 시: colima start" >&2
  echo "[compose] → 확인: docker info" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "[compose] 'docker compose'(Compose V2 플러그인)이 없습니다." >&2
  echo "[compose] → Docker Desktop 설치·업데이트(권장), 또는 Docker CLI용 compose 플러그인 설치" >&2
  echo "[compose] → 확인: docker compose version" >&2
  exit 127
fi

exec docker compose "$@"
