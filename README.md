# MSA 블로그 플랫폼 (my-msa-project-new)

Spring Cloud Gateway, Auth/User/Post/Search, Next.js, Kafka, Redis, PostgreSQL 등으로 구성된 MSA 예제 프로젝트입니다.

## 빠른 시작

- **Docker**: [Docker Desktop](https://www.docker.com/products/docker-desktop/) 실행 후 `docker compose version` 확인. 명령은 **`docker compose`**(공백)만 사용합니다.
- **로컬 전체 실행**: [docs/로컬-실행-및-배포-가이드.md](docs/로컬-실행-및-배포-가이드.md)  
  - 한 줄 요약: `./scripts/init-env.sh` → `.env` 수정 → `./scripts/local-up.sh`
- **환경 변수 목록**: [.env.example](.env.example)
- **CI/CD**: `main` / `master` 에 **push** 하면 GitHub Actions 가 **클라우드에서** 이미지를 빌드해 GHCR 에 올리고(로컬 Docker 와 별개), 설정 시 서버에 자동 배포합니다. 서버 디스크·캐시 정리는 [scripts/server-docker-cleanup.sh](scripts/server-docker-cleanup.sh) 참고.

자세한 단계·Secrets·서버 준비는 위 가이드 문서를 따르세요.

## Fork 후 최소 설정

1. 루트: `.env.example` 을 복사해 `.env` 로 두고 값만 채웁니다.  
2. Next.js 로컬 빌드(`npm run build`)만 할 때: `frontend/nextjs-app/.env.production.example` → `.env.production`  
3. 프론트 로컬 개발: `frontend/nextjs-app/.env.example` → `.env.local`  
4. `docker-compose.override.yml`, `data/`, `**/target/`, `node_modules/` 등은 **저장소에 올리지 않습니다**([.gitignore](.gitignore) 참고). push 전 `git status` 로 `.env`·키 파일이 없는지 확인하세요.
