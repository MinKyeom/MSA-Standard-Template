#!/usr/bin/env bash
# Docker reverse-proxy(msa-nginx)가 호스트 80/443 을 쓰기 전, systemd 로 떠 있는
# 패키지 Nginx·Apache 등을 중지합니다. CI SSH 배포 또는 수동 compose 직전에 실행하세요.
#
# 필요: 배포 사용자에게 `sudo systemctl stop …` 권한(NOPASSWD 또는 이미 root).
# 실패 시: sudo ss -tlnp | grep -E ':80|:443' 로 점유 프로세스 확인.
set -euo pipefail

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
      ss -tlnp 2>/dev/null | grep -E ":${p}\s" || true
      echo "[free-host-ports] Hint: stop the process above, or run: sudo systemctl stop nginx" >&2
      exit 1
    fi
  done
fi

echo "[free-host-ports] 80/443 appear free for Docker."
