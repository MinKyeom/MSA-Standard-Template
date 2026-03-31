#!/usr/bin/env bash
set -euo pipefail

# Docker json-file 로그 및 주요 시스템 로그를 주기 순환
# - Docker 로그는 compose logging(max-size/max-file)와 병행 안전장치 역할
# - copytruncate 로 프로세스 재시작 없이 회전

if ! command -v logrotate >/dev/null 2>&1; then
  echo "[logrotate] logrotate not installed; skip"
  exit 0
fi

cat <<'EOF' >/tmp/msa-docker-containers.logrotate
/var/lib/docker/containers/*/*.log {
  daily
  rotate 7
  size 50M
  missingok
  notifempty
  compress
  delaycompress
  copytruncate
}
EOF

cat <<'EOF' >/tmp/msa-system.logrotate
/var/log/syslog /var/log/auth.log /var/log/kern.log {
  weekly
  rotate 4
  missingok
  notifempty
  compress
  delaycompress
  copytruncate
}
EOF

if command -v sudo >/dev/null 2>&1; then
  if ! sudo mv /tmp/msa-docker-containers.logrotate /etc/logrotate.d/msa-docker-containers \
    || ! sudo mv /tmp/msa-system.logrotate /etc/logrotate.d/msa-system \
    || ! sudo chmod 644 /etc/logrotate.d/msa-docker-containers /etc/logrotate.d/msa-system; then
    echo "[logrotate] install failed (sudo permission); skip"
    exit 0
  fi
  sudo logrotate -f /etc/logrotate.d/msa-docker-containers || true
else
  if ! mv /tmp/msa-docker-containers.logrotate /etc/logrotate.d/msa-docker-containers \
    || ! mv /tmp/msa-system.logrotate /etc/logrotate.d/msa-system \
    || ! chmod 644 /etc/logrotate.d/msa-docker-containers /etc/logrotate.d/msa-system; then
    echo "[logrotate] install failed (permission); skip"
    exit 0
  fi
  logrotate -f /etc/logrotate.d/msa-docker-containers || true
fi

echo "[logrotate] rules installed"
