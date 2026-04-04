#!/bin/sh
set -e

export NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"
export NGINX_HTTPS_PORT="${NGINX_HTTPS_PORT:-443}"

# PRIMARY / SSL 이 비어 있으면 NEXT_PUBLIC_SITE_URL 또는 FRONTEND_URL 에서 유도 (운영 .env 누락 방지)
if [ -z "${PRIMARY_SERVER_NAMES:-}" ]; then
  _SITE="${NEXT_PUBLIC_SITE_URL:-}"
  [ -z "$_SITE" ] && _SITE="${FRONTEND_URL:-}"
  if [ -n "$_SITE" ]; then
    _H="${_SITE#*://}"
    _H="${_H%%/*}"
    _H="${_H%%:*}"
    if [ -n "$_H" ]; then
      case "$_H" in
        www.*)
          _A="${_H#www.}"
          PRIMARY_SERVER_NAMES="${_H} ${_A}"
          ;;
        *)
          PRIMARY_SERVER_NAMES="${_H} www.${_H}"
          ;;
      esac
      export PRIMARY_SERVER_NAMES
    fi
  fi
fi

if [ -z "${SSL_CERT_PATH:-}" ] && [ -n "${PRIMARY_SERVER_NAMES:-}" ]; then
  _FIRST=$(printf '%s' "$PRIMARY_SERVER_NAMES" | awk '{print $1}')
  if [ -n "$_FIRST" ]; then
    export SSL_CERT_PATH="/etc/letsencrypt/live/${_FIRST}/fullchain.pem"
    export SSL_KEY_PATH="/etc/letsencrypt/live/${_FIRST}/privkey.pem"
  fi
fi

export PRIMARY_SERVER_NAMES="${PRIMARY_SERVER_NAMES:-example.com www.example.com}"
export SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/letsencrypt/live/example.com/fullchain.pem}"
export SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/letsencrypt/live/example.com/privkey.pem}"

export UPSTREAM_GATEWAY="${UPSTREAM_GATEWAY:-api-gateway:8085}"
export UPSTREAM_FRONTEND="${UPSTREAM_FRONTEND:-frontend:3000}"
export METRICS_ALLOW_IP="${METRICS_ALLOW_IP:-127.0.0.1}"
export NODE_EXPORTER_UPSTREAM="${NODE_EXPORTER_UPSTREAM:-node-exporter:9100}"

export DEV_DOMAIN="${DEV_DOMAIN:-dev.example.com}"
export DEV_SSL_CERT="${DEV_SSL_CERT:-/etc/letsencrypt/live/dev.example.com/fullchain.pem}"
export DEV_SSL_KEY="${DEV_SSL_KEY:-/etc/letsencrypt/live/dev.example.com/privkey.pem}"
export DEV_UPSTREAM_FRONTEND="${DEV_UPSTREAM_FRONTEND:-frontend:3000}"
export DEV_UPSTREAM_GATEWAY="${DEV_UPSTREAM_GATEWAY:-api-gateway:8085}"

VARS_DOLLAR='$NGINX_HTTP_PORT $NGINX_HTTPS_PORT $PRIMARY_SERVER_NAMES $SSL_CERT_PATH $SSL_KEY_PATH $UPSTREAM_GATEWAY $UPSTREAM_FRONTEND $METRICS_ALLOW_IP $NODE_EXPORTER_UPSTREAM $DEV_DOMAIN $DEV_SSL_CERT $DEV_SSL_KEY $DEV_UPSTREAM_FRONTEND $DEV_UPSTREAM_GATEWAY'

TDIR="/etc/nginx/templates-raw"
OUT="/etc/nginx/conf.d/default.conf"

{
  cat "${TDIR}/10-main.conf.template"
  if [ "${NGINX_ENABLE_DEV_SERVER:-0}" = "1" ]; then
    cat "${TDIR}/20-dev.conf.template"
  fi
} | envsubst "$VARS_DOLLAR" > "$OUT"

nginx -t
exec nginx -g 'daemon off;'
