#!/usr/bin/env bash
# Fluent Bit(msa-fluent-bit)만 기동 — docker-compose.yml 의 monitoring 프로필
# CI/CD 배포(COMPOSE_PROFILES=edge)에는 포함되지 않으며, 서버에서 필요할 때만 실행하세요.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -f .env ]; then
  echo "[start-fluent-bit] .env 가 없습니다. cp .env.example .env 후 값을 채우거나 배포 디렉터리에서 실행하세요." >&2
  exit 1
fi
docker compose --profile monitoring up -d fluent-bit
echo "[start-fluent-bit] OK — docker compose logs -f fluent-bit 로 확인"
