#!/usr/bin/env bash
# Docker reverse-proxy(msa-nginx)가 호스트 80/443 을 쓰기 전, 점유 주체를 정리합니다.
# 1) 기존 msa-nginx 컨테이너 정리  2) systemd nginx/apache2 중지  3) 포트 잔여 점유 확인
# CI SSH 배포 또는 수동 compose 직전에 실행하세요.
#
# 필요: 배포 사용자에게 `sudo systemctl stop …` 권한(NOPASSWD 또는 이미 root).
# 실패 시: sudo ss -tlnp | grep -E ':80|:443' 로 점유 프로세스 확인.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 이전 배포의 msa-nginx 가 떠 있으면 먼저 제거(자기 자신과의 80/443 충돌 방지)
if docker ps -a --format '{{.Names}}' | grep -qx 'msa-nginx'; then
  echo "[free-host-ports] removing stale container: msa-nginx"
  docker rm -f msa-nginx >/dev/null 2>&1 || true
fi

stop_if_active() {
  local unit="$1"
  if systemctl is-active --quiet "$unit" 2>/dev/null; then
    echo "[free-host-ports] stopping ${unit} (releases 80/443 for Docker msa-nginx)..."
    sudo systemctl stop "$unit"
  fi
}

stop_if_active nginx
stop_if_active apache2

if command -v ss >/dev/null 2>&1; then
  for p in 80 443; do
    if ss -H -tln 2>/dev/null | grep -qE ":${p}\s"; then
      echo "[free-host-ports] ERROR: port ${p} is still in use. Bind will fail for msa-nginx." >&2
      sudo ss -tlnp 2>/dev/null | grep -E ":${p}\s" || ss -tlnp 2>/dev/null | grep -E ":${p}\s" || true
      echo "[free-host-ports] Hint: stop the process above, or run: sudo systemctl stop nginx" >&2
      exit 1
    fi
  done
fi

echo "[free-host-ports] 80/443 appear free for Docker."
