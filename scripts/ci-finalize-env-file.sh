#!/usr/bin/env bash
# CI/배포용 .env 파일에 이미지 태그·프로필을 안전하게 덮어씁니다.
# ENV_VARS에 DOCKER_IMAGE_PREFIX/IMAGE_TAG/COMPOSE_PROFILES= 가 있어도 중복·빈 값을 정리합니다.
#
# 사용: ci-finalize-env-file.sh <env-file> <docker_image_prefix> <image_tag>
set -euo pipefail

ENV_FILE="${1:?env file}"
PREFIX="${2:?docker image prefix}"
TAG="${3:?image tag}"

grep -v '^DOCKER_IMAGE_PREFIX=' "$ENV_FILE" | grep -v '^IMAGE_TAG=' > "${ENV_FILE}.tmp"
mv "${ENV_FILE}.tmp" "$ENV_FILE"
echo "DOCKER_IMAGE_PREFIX=${PREFIX}" >> "$ENV_FILE"
echo "IMAGE_TAG=${TAG}" >> "$ENV_FILE"

if ! grep -qE '^COMPOSE_PROFILES=.+$' "$ENV_FILE"; then
  grep -v '^COMPOSE_PROFILES=' "$ENV_FILE" > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "$ENV_FILE"
  echo "COMPOSE_PROFILES=edge" >> "$ENV_FILE"
fi
