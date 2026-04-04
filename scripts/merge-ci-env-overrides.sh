#!/usr/bin/env bash
# GitHub Actions Variables(PUBLIC_*)를 .env 파일에 병합하고,
# https 공개 API URL 이 있으면 OAUTH2_REDIRECT_BASE·CORS 가 빠졌거나 localhost 이면 보정합니다.
# 사용: SITE API CHAT 환경변수 설정 후
#   bash scripts/merge-ci-env-overrides.sh .env.build
set -euo pipefail

f="${1:?usage: merge-ci-env-overrides.sh <env-file>}"
[ -f "$f" ] || { echo "missing file: $f" >&2; exit 1; }

remove_key() {
  local k="$1"
  grep -v "^${k}=" "$f" > "${f}.tmp" && mv "${f}.tmp" "$f"
}

SITE="${SITE:-}"
API="${API:-}"
CHAT="${CHAT:-}"

if [ -n "$SITE" ]; then
  remove_key "NEXT_PUBLIC_SITE_URL"
  echo "NEXT_PUBLIC_SITE_URL=$SITE" >> "$f"

  # Nginx(reverse-proxy): PRIMARY / SSL 이 ENV_VARS 에 없으면 PUBLIC_SITE_URL 기준으로 채움
  if [[ "$SITE" == *://* ]]; then
    if ! grep -q '^PRIMARY_SERVER_NAMES=' "$f"; then
      hp="${SITE#*://}"
      hp="${hp%%/*}"
      hp="${hp%%:*}"
      if [ -n "$hp" ]; then
        case "$hp" in
          www.*)
            ap="${hp#www.}"
            echo "PRIMARY_SERVER_NAMES=${hp} ${ap}" >> "$f"
            ;;
          *)
            echo "PRIMARY_SERVER_NAMES=${hp} www.${hp}" >> "$f"
            ;;
        esac
      fi
    fi
    if ! grep -q '^SSL_CERT_PATH=' "$f"; then
      first=$(grep '^PRIMARY_SERVER_NAMES=' "$f" | head -1 | cut -d= -f2- | awk '{print $1}')
      if [ -n "$first" ]; then
        echo "SSL_CERT_PATH=/etc/letsencrypt/live/${first}/fullchain.pem" >> "$f"
        echo "SSL_KEY_PATH=/etc/letsencrypt/live/${first}/privkey.pem" >> "$f"
      fi
    fi
  fi
fi

if [ -n "$API" ]; then
  for k in NEXT_PUBLIC_API_URL NEXT_PUBLIC_AUTH_API_URL NEXT_PUBLIC_USER_API_URL NEXT_PUBLIC_POST_API_URL; do
    remove_key "$k"
  done
  echo "NEXT_PUBLIC_API_URL=$API" >> "$f"
  echo "NEXT_PUBLIC_AUTH_API_URL=$API" >> "$f"
  echo "NEXT_PUBLIC_USER_API_URL=$API" >> "$f"
  echo "NEXT_PUBLIC_POST_API_URL=$API" >> "$f"
fi

if [ -n "$CHAT" ]; then
  remove_key "NEXT_PUBLIC_CHATBOT_API_URL"
  echo "NEXT_PUBLIC_CHATBOT_API_URL=$CHAT" >> "$f"
elif [ -n "$API" ]; then
  remove_key "NEXT_PUBLIC_CHATBOT_API_URL"
  echo "NEXT_PUBLIC_CHATBOT_API_URL=${API}/chat" >> "$f"
fi

# 공개 오리진만 남김 (예: https://도메인/path → https://도메인)
origin_from_url() {
  local u="${1%/}"
  [[ "$u" == *://* ]] || return 1
  local scheme="${u%%://*}"
  local rest="${u#*://}"
  local hostport="${rest%%/*}"
  echo "${scheme}://${hostport}"
}

if [ -n "$API" ]; then
  ORIG=$(origin_from_url "$API" || true)
  if [[ "$ORIG" == https://* ]]; then
    need_oauth_fix=0
    if ! grep -q '^OAUTH2_REDIRECT_BASE=' "$f"; then
      need_oauth_fix=1
    elif grep -qE '^OAUTH2_REDIRECT_BASE=http://localhost(:\d+)?$' "$f"; then
      need_oauth_fix=1
    elif grep -qE '^OAUTH2_REDIRECT_BASE=http://127\.0\.0\.1(:\d+)?$' "$f"; then
      need_oauth_fix=1
    elif ! grep -qE '^OAUTH2_REDIRECT_BASE=https://' "$f"; then
      need_oauth_fix=1
    fi
    if [ "$need_oauth_fix" -eq 1 ]; then
      remove_key "OAUTH2_REDIRECT_BASE"
      echo "OAUTH2_REDIRECT_BASE=$ORIG" >> "$f"
    fi

    hostpart="${ORIG#https://}"
    hostpart="${hostpart#http://}"
    hostpart="${hostpart%%/*}"
    if [ -z "$hostpart" ]; then
      :
    elif ! grep -q "^CORS_ALLOWED_ORIGINS=" "$f"; then
      echo "CORS_ALLOWED_ORIGINS=$ORIG" >> "$f"
    elif ! grep "^CORS_ALLOWED_ORIGINS=" "$f" | grep -qF "$hostpart"; then
      line=$(grep "^CORS_ALLOWED_ORIGINS=" "$f" | head -1)
      val="${line#CORS_ALLOWED_ORIGINS=}"
      remove_key "CORS_ALLOWED_ORIGINS"
      echo "CORS_ALLOWED_ORIGINS=${val},${ORIG}" >> "$f"
    fi
  fi
fi
