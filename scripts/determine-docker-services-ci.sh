#!/usr/bin/env bash
# CI: 변경 파일에 따라 docker compose 서비스 목록 또는 ALL / RETAG 출력.
#   ALL  — 앱 이미지 + reverse-proxy(nginx) 전부 빌드
#   RETAG — 빌드 없이 이전 SHA 태그만 새 SHA로 복사(문서만 바뀐 경우 등)
#   그 외 — 빌드할 compose 서비스 이름을 공백 구분으로 한 줄
#
# 인자: <before_sha> <after_sha>
# 환경: FULL_BUILD=true 이면 항상 ALL
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BEFORE="${1:-}"
AFTER="${2:-}"

if [ "${FULL_BUILD:-false}" = "true" ]; then
  echo "ALL"
  exit 0
fi

if [ -z "$BEFORE" ] || [ "$BEFORE" = "0000000000000000000000000000000000000000" ]; then
  echo "ALL"
  exit 0
fi

files=()
while IFS= read -r line || [ -n "$line" ]; do
  [ -n "$line" ] && files+=("$line")
done < <(git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null || true)
if [ ${#files[@]} -eq 0 ]; then
  echo "RETAG"
  exit 0
fi

# 1) 전체 빌드 트리거
for f in "${files[@]}"; do
  if [[ "$f" == "docker-compose.yml" ]] || [[ "$f" == .github/workflows/* ]]; then
    echo "ALL"
    exit 0
  fi
done

only_retag=1
SVCS=""

append_svc() {
  local s="$1"
  case " $SVCS " in
    *" $s "*) ;;
    *) SVCS="${SVCS:+$SVCS }$s" ;;
  esac
}

for f in "${files[@]}"; do
  if [[ "$f" == nginx/* ]]; then
    only_retag=0
    append_svc reverse-proxy
    continue
  fi
  # 이미지에 영향 없음 → 이번 커밋만으로는 RETAG 후보
  if [[ "$f" == scripts/* ]] || [[ "$f" == monitoring/* ]] \
    || [[ "$f" == .env.example ]] || [[ "$f" == .gitignore ]] \
    || [[ "$f" == docker-compose.local.yml ]] \
    || [[ "$f" == *".md" ]] || [[ "$f" == *".markdown" ]] || [[ "$f" == LICENSE ]]; then
    continue
  fi

  if [[ "$f" == backend/gateway-service/* ]] || [[ "$f" == backend/gateway-service ]]; then
    only_retag=0
    append_svc api-gateway
    continue
  fi
  if [[ "$f" == backend/auth-service/* ]] || [[ "$f" == backend/auth-service ]]; then
    only_retag=0
    append_svc auth-service
    continue
  fi
  if [[ "$f" == backend/user-service/* ]] || [[ "$f" == backend/user-service ]]; then
    only_retag=0
    append_svc user-service
    continue
  fi
  if [[ "$f" == backend/post-service/* ]] || [[ "$f" == backend/post-service ]]; then
    only_retag=0
    append_svc post-service
    continue
  fi
  if [[ "$f" == backend/smtp-service/* ]] || [[ "$f" == backend/smtp-service ]]; then
    only_retag=0
    append_svc mail-service
    continue
  fi
  if [[ "$f" == backend/fastapi-ai/* ]] || [[ "$f" == backend/fastapi-ai ]]; then
    only_retag=0
    append_svc fastapi-ai
    continue
  fi
  if [[ "$f" == backend/search-service/* ]] || [[ "$f" == backend/search-service ]]; then
    only_retag=0
    append_svc search-service
    continue
  fi
  if [[ "$f" == frontend/nextjs-app/* ]] || [[ "$f" == frontend/nextjs-app ]]; then
    only_retag=0
    append_svc frontend
    continue
  fi

  echo "ALL"
  exit 0
done

if [ "$only_retag" -eq 1 ]; then
  echo "RETAG"
  exit 0
fi

echo "$SVCS"
