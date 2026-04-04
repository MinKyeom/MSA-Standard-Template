#!/usr/bin/env bash
# 호스트에 설치된 Nginx용 설정 생성(선택). Docker 운영은 reverse-proxy 컨테이너가 templates 를 직접 사용.
# 사용: cp nginx/.env.nginx.example nginx/.env.nginx 후 수정 → ./scripts/render-nginx.sh
set -euo pipefail

if ! command -v envsubst >/dev/null 2>&1; then
  echo "envsubst 가 없습니다. Ubuntu: sudo apt-get install -y gettext-base" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TDIR="${ROOT}/nginx/templates"
OUT="${2:-${ROOT}/nginx/msa-project.rendered.conf}"
ENV_FILE="${1:-${ROOT}/nginx/.env.nginx}"

if [[ ! -f "${TDIR}/10-main.conf.template" ]]; then
  echo "Missing ${TDIR}/10-main.conf.template" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

export NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"
export NGINX_HTTPS_PORT="${NGINX_HTTPS_PORT:-443}"
export PRIMARY_SERVER_NAMES="${PRIMARY_SERVER_NAMES:-example.com www.example.com}"
export SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/letsencrypt/live/example.com/fullchain.pem}"
export SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/letsencrypt/live/example.com/privkey.pem}"
export UPSTREAM_GATEWAY="${UPSTREAM_GATEWAY:-127.0.0.1:8085}"
export UPSTREAM_FRONTEND="${UPSTREAM_FRONTEND:-127.0.0.1:3000}"
export METRICS_ALLOW_IP="${METRICS_ALLOW_IP:-127.0.0.1}"
export NODE_EXPORTER_UPSTREAM="${NODE_EXPORTER_UPSTREAM:-127.0.0.1:9100}"
export DEV_DOMAIN="${DEV_DOMAIN:-dev.example.com}"
export DEV_SSL_CERT="${DEV_SSL_CERT:-/etc/letsencrypt/live/dev.example.com/fullchain.pem}"
export DEV_SSL_KEY="${DEV_SSL_KEY:-/etc/letsencrypt/live/dev.example.com/privkey.pem}"
export DEV_UPSTREAM_FRONTEND="${DEV_UPSTREAM_FRONTEND:-127.0.0.1:4000}"
export DEV_UPSTREAM_GATEWAY="${DEV_UPSTREAM_GATEWAY:-127.0.0.1:9085}"

VARS_DOLLAR='$NGINX_HTTP_PORT $NGINX_HTTPS_PORT $PRIMARY_SERVER_NAMES $SSL_CERT_PATH $SSL_KEY_PATH $UPSTREAM_GATEWAY $UPSTREAM_FRONTEND $METRICS_ALLOW_IP $NODE_EXPORTER_UPSTREAM $DEV_DOMAIN $DEV_SSL_CERT $DEV_SSL_KEY $DEV_UPSTREAM_FRONTEND $DEV_UPSTREAM_GATEWAY'

{
  cat "${TDIR}/10-main.conf.template"
  if [ "${NGINX_ENABLE_DEV_SERVER:-0}" = "1" ]; then
    cat "${TDIR}/20-dev.conf.template"
  fi
} | envsubst "$VARS_DOLLAR" > "$OUT"

echo "Wrote $OUT"
