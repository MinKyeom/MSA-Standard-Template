#!/usr/bin/env bash
# Fluent Bit 컨테이너만 중지
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose --profile monitoring stop fluent-bit 2>/dev/null || docker stop msa-fluent-bit 2>/dev/null || true
echo "[stop-fluent-bit] OK"
