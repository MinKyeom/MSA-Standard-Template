#!/usr/bin/env bash
# docker push 재시도 — GHCR intermittent "unknown blob" 완화
# 사용: ci-docker-push-retry.sh <image-ref> [max_attempts]
set -euo pipefail

IMAGE="${1:?image ref}"
MAX="${2:-3}"
DELAY="${CI_PUSH_RETRY_DELAY:-15}"

for attempt in $(seq 1 "$MAX"); do
  echo "::notice:: push ${IMAGE} (attempt ${attempt}/${MAX})"
  if docker push "$IMAGE"; then
    exit 0
  fi
  if [ "$attempt" -lt "$MAX" ]; then
    echo "::warning:: push ${IMAGE} failed — retry in ${DELAY}s"
    sleep "$DELAY"
  fi
done

echo "::error:: push ${IMAGE} failed after ${MAX} attempts"
exit 1
