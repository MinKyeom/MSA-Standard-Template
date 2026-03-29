# GitHub 공개 저장소 생성 및 CI/CD 자동화 가이드

이 문서는 **공개(Public) GitHub 저장소**를 새로 만들고 코드를 올린 뒤, 저장소에 포함된 **GitHub Actions 워크플로**(`.github/workflows/deploy.yml`)로 **이미지 빌드·GHCR 푸시·(선택) 서버 자동 배포**까지 연결하는 절차를 정리합니다.

---

## 1. 공개 저장소에서 주의할 것

| 항목 | 설명 |
|------|------|
| 비밀 정보 | **`.env`**, API 키, JWT, DB 비밀번호, OAuth 클라이언트 시크릿 등은 **절대 커밋하지 않습니다.** |
| `.gitignore` | 이 프로젝트는 `.env`, `frontend/nextjs-app/.env.local` 등을 이미 무시합니다. **`git status`에 비밀 파일이 없는지** 푸시 전에 확인하세요. |
| 과거 커밋 | 예전에 실수로 `.env`를 올린 적이 있으면, 히스토리에 남아 있을 수 있습니다. 공개 전 **키·비밀번호는 교체**하는 것이 안전합니다. |

---

## 2. GitHub에서 공개 저장소 만들기

1. GitHub에 로그인 → 우측 상단 **+** → **New repository**.
2. **Repository name** 입력(예: `my-msa-project-new`).
3. **Public** 선택.
4. **Create repository** 클릭.
5. 기본 브랜치는 **`main`** 또는 **`master`** 중 하나로 맞춥니다. 워크플로는 두 브랜치 모두에 `push` 시 동작합니다.

---

## 3. 로컬 프로젝트 연결 및 첫 푸시

프로젝트 루트( `docker-compose.yml` 이 있는 디렉터리)에서:

```bash
cd /path/to/my-msa-project-new

git init
git branch -M main

git remote add origin https://github.com/본인계정/저장소이름.git
# SSH를 쓰는 경우: git@github.com:본인계정/저장소이름.git

git add .
git status
git commit -m "Initial commit: MSA stack"
git push -u origin main
```

`git status`에서 `.env` 등이 **추적 대상으로 나오면** `.gitignore`를 확인하고 커밋에서 제외하세요.

---

## 4. GitHub Actions 및 패키지 권한

1. 저장소 **Settings** → **Actions** → **General**.
2. **Actions permissions**: 정책에 맞게 Actions 사용을 허용합니다.
3. 같은 페이지 하단 **Workflow permissions**:
   - 워크플로가 `GITHUB_TOKEN`으로 **GitHub Container Registry(GHCR)** 에 이미지를 푸시하려면, 저장소 설정에서 **Read and write** 권한이 필요할 수 있습니다(조직 정책에 따름).
4. 워크플로 `build-and-push` job에 `permissions: packages: write` 가 정의되어 있습니다.

### 4.1 서버에서 `docker compose pull` 할 때

- GHCR의 패키지(이미지)가 **Private**이면, 배포 서버에서 한 번 **`docker login ghcr.io`** (GitHub PAT 사용)이 필요합니다.
- 패키지를 **Public**으로 두면(저장소와 별도로 Packages 설정), 로그인 없이 pull 할 수 있는 경우가 많습니다. 보안 정책에 맞게 선택하세요.

---

## 5. 워크플로가 하는 일 (요약)

파일: `.github/workflows/deploy.yml`

| 트리거 | 동작 |
|--------|------|
| `main` 또는 `master`에 **push** | `docker compose build --parallel` 후 이미지 **푸시** |
| **Actions** 탭에서 **Run workflow** | 위와 동일(수동 실행) |

- 이미지 경로: **`ghcr.io/<소문자 owner>/<소문자 repo>`** (워크플로에서 저장소명을 소문자로 변환).
- 이미지 태그: **해당 커밋 SHA** (`IMAGE_TAG`). 배포 job이 서버에 `export IMAGE_TAG=...` 로 넘깁니다.

### 5.1 배포 job 조건

다음 **Secrets** 가 모두 있을 때 **deploy** job이 실행됩니다. `DEPLOY_PATH` 는 비워 두면 `/home/<USERNAME>/<저장소이름>` 을 씁니다.

| Secret | 설명 |
|--------|------|
| `ENV_VARS` | 프로젝트 루트 `.env` 와 같은 **다줄** 내용 |
| `HOST` | 서버 호스트(IP 또는 도메인) |
| `USERNAME` | SSH 사용자명 |
| `KEY` | SSH 개인 키 전체(PEM) |
| `DEPLOY_PATH` | (선택) 배포 디렉터리 절대 경로 |

빌드 job도 **`ENV_VARS` 필수**입니다(`NEXT_PUBLIC_*`·`JWT_SECRET` 등 포함).

---

## 6. GitHub Secrets 설정

**Settings** → **Secrets and variables** → **Actions** → **Secrets**

| Secret | 설명 |
|--------|------|
| `ENV_VARS` | 로컬 `.env` 파일 **전체**를 복사해 한 Secret(다줄)로 저장 |
| `HOST` | 서버 주소 |
| `USERNAME` | SSH 사용자 |
| `KEY` | SSH 개인 키 PEM 전체 |
| `DEPLOY_PATH` | (선택) 배포 경로. 없으면 `~/저장소이름` |

`ENV_VARS` 안에 `NEXT_PUBLIC_*`, `JWT_SECRET`, `POSTGRES_PASSWORD`, 운영용 `DOCKER_IMAGE_PREFIX`(선택) 등을 넣습니다. CI가 빌드·배포 시 맨 아래에 `DOCKER_IMAGE_PREFIX`(ghcr)·`IMAGE_TAG`(SHA) 를 **한 줄씩 추가**해 이번 이미지를 씁니다.

---

## 7. GitHub Variables (선택)

현재 워크플로는 **`ENV_VARS` Secret만**으로 빌드 인자를 채웁니다. Variables(`PUBLIC_SITE_URL` 등)는 **필수 아님**입니다. 값은 `.env`에 넣어 `ENV_VARS`에 포함하면 됩니다.

---

## 8. 배포 서버 준비

1. 서버에 **동일 저장소 클론** — 경로는 `DEPLOY_PATH` 이거나, 비우면 `/home/<USERNAME>/<저장소이름>` (저장소 디렉터리 이름 = GitHub 저장소 이름).
2. **첫 배포 전** `.env` 가 없어도 됨. 배포 시 Actions 가 `ENV_VARS` Secret 내용으로 서버의 `.env` 를 **덮어씁니다.**
3. 서버에 **Docker**·**Docker Compose V2**·**Git** 설치.
4. GHCR 이미지가 private이면 서버에서 한 번 `docker login ghcr.io` (PAT).
5. SSH 사용자가 해당 경로에서 `git pull`, `docker compose` 실행 가능해야 함.

---

## 9. 동작 확인

1. `main`(또는 `master`)에 변경을 **push**합니다.
2. 저장소 **Actions** 탭에서 **Build and deploy** 워크플로가 성공했는지 확인합니다.
3. **Packages**에서 `gateway`, `frontend` 등 이미지가 생성·갱신되었는지 확인합니다.
4. Secrets를 모두 넣었다면 **deploy** job도 성공하는지 확인합니다.

---

## 10. 관련 문서·파일

| 경로 | 내용 |
|------|------|
| [Nginx-운영-가이드.md](./Nginx-운영-가이드.md) | CI 직후 체크리스트, `/etc/nginx` vs 템플릿, `render-nginx.sh` |
| [배포-등록-샘플.md](./배포-등록-샘플.md) | 채워 넣기용 템플릿 경로 (`docs/templates/*`) |
| [로컬-실행-및-배포-가이드.md](./로컬-실행-및-배포-가이드.md) | 로컬 Docker 스택, 서버 `.env`, 트러블슈팅 |
| `.github/workflows/deploy.yml` | CI/CD 워크플로 원본 |
| `.env.example` | 서버·로컬용 환경 변수 템플릿(비밀 없음) |

---

## 11. 체크리스트 (공개 저장소 퍼블리시 전)

- [ ] `git status` / 최근 커밋에 `.env`, 키, 비밀번호 없음
- [ ] 기본 브랜치가 `main` 또는 `master`
- [ ] Actions 및 Workflow 권한 허용
- [ ] (배포 사용 시) Secrets 4종 + 서버 클론·`.env`·`DOCKER_IMAGE_PREFIX`
- [ ] `ENV_VARS` 에 운영 `NEXT_PUBLIC_*`·비밀 값 포함(GitHub Secret 한도 약 48KB)
- [ ] (선택) GHCR 패키지 Public 여부 또는 서버 `docker login ghcr.io`

이 순서를 따르면 공개 저장소에서도 CI/CD 파이프라인을 안전하게 사용할 수 있습니다.
