#!/usr/bin/env bash
# 푸시·배포 직후: 미사용 이미지·빌드 캐시만 정리 (볼륨·DB 데이터는 건드리지 않음)
# - GitHub Actions 러너: 빌드 후 디스크 확보
# - 운영 서버: 이전 커밋 SHA 이미지 등 정리
#
# 안전성(Docker 기본 동작):
# - image prune -a 는 "어떤 컨테이너에도 연결되지 않은" 이미지만 삭제합니다.
# - 실행 중(Running)·일시중지·Exit 된 컨테이너가 붙어 있으면 그 이미지/레이어는 삭제 대상이 아닙니다.
# - "아직 늦게 뜨는" 서비스라도 컨테이너가 생성된 시점에 이미지 참조가 잡히므로, 그 이미지를 prune 이 지우지 않습니다.
# - 배포 스크립트는 docker compose up 이 성공한 뒤에만 이 스크립트를 호출하므로(up 실패 시 set -e 로 prune 전에 종료),
#   기동 실패로 중단된 경우에는 정리가 실행되지 않습니다(prune 미실행).
set -euo pipefail

echo "[prune] docker image prune -af (미사용 이미지)"
docker image prune -af

echo "[prune] docker builder prune -f (BuildKit 캐시)"
docker builder prune -f 2>/dev/null || true
