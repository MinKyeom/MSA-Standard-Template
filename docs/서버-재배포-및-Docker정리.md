# 서버: 기존 스택 내리기 · GHCR 재배포 · Docker 정리

기존에 `docker compose` 로 **로컬 프로젝트 이름 기준 이미지**(`my-msa-project-new-frontend` 등)를 쓰던 서버를, GitHub Actions + **GHCR 이미지**로 바꿀 때의 순서입니다.

저장소 예: [MinKyeom/MSA-Standard-Template](https://github.com/MinKyeom/MSA-Standard-Template.git)  
GHCR 프리픽스(소문자): `ghcr.io/minkyeom/msa-standard-template`

---

## 0. CI/CD로 바로 올리기(로컬 → Actions → 서버)

1. **GitHub 저장소**에 코드 push (`main` 또는 `master`).
2. **Repository → Settings → Secrets and variables → Actions** 에 다음을 등록합니다.  
   - `ENV_VARS`: 프로젝트 루트 `.env` 와 동일한 다줄 내용(비밀·URL·DB 등). CI가 끝에 `DOCKER_IMAGE_PREFIX`·`IMAGE_TAG` 를 덮어씁니다.  
   - `HOST`, `USERNAME`, `KEY`(SSH 개인 키 전체)  
   - **`DEPLOY_PATH`**: 서버에서 실제 clone 경로가 저장소 이름과 다르면 **필수**. 예: `/home/ubuntu/my-msa-project-new`  
     (비우면 기본값은 `/home/<USERNAME>/<저장소이름>` → `MSA-Standard-Template` 일 때 `~/MSA-Standard-Template`)
3. **Variables**(선택): Next 빌드용 `NEXT_PUBLIC_*` 등은 워크플로·`.env.example` 안내에 맞춥니다.
4. Push 후 **Actions** 탭에서 워크플로 성공 여부를 확인합니다. 배포 단계는 `HOST`·`USERNAME`·`KEY`·`ENV_VARS` 가 모두 있을 때만 실행됩니다.
5. 서버에서 `docker compose ps` 로 컨테이너·이미지가 `ghcr.io/minkyeom/msa-standard-template/...` 인지 확인합니다.

**GHCR 이미지가 Private**이면 서버에서 한 번 로그인합니다.

```bash
echo "<GITHUB_PAT_packages_read>" | docker login ghcr.io -u MinKyeom --password-stdin
```

---

## 0-1. Git 커밋 전 보안 점검(권장)

- `git status` 에 **`.env`**, `*.pem`, `.env.local`, `.env.build` 가 **없어야** 합니다(`.gitignore` 로 막혀 있어도 실수로 `git add -f` 하면 올라갑니다).
- Java **`target/`**, **`node_modules/`**, **`.next/`** 는 커밋하지 않습니다(빌드 산출물에 치환된 설정·시크릿이 섞일 수 있음).
- 과거에 비밀이 커밋된 적이 있으면 **해당 키·비밀번호는 교체(로테이션)** 하세요. 히스토리에 남은 내용은 `git filter-repo` 등으로 별도 정리가 필요합니다.

---

## 1. 데이터를 유지할지 먼저 결정

| 목적 | `docker compose down` |
|------|------------------------|
| DB·업로드 데이터 **유지** | `docker compose down` 만 (`-v` **쓰지 않음**) |
| 볼륨까지 삭제(초기화) | `docker compose down -v` (**복구 어려움**) |

PostgreSQL `data/` 호스트 마운트를 쓰는 구성이면, `-v` 없이 내려도 디스크 데이터는 대부분 남습니다. **확실히 알고 선택**하세요.

**DB에 데이터가 없고 처음부터 깨끗이 가도 될 때** 예시 순서:

```bash
cd ~/my-msa-project-new   # 실제 배포 경로
docker compose down -v    # compose가 만든 볼륨 제거(데이터 초기화)
# 호스트에 data/ 등을 쓰는 경우, 필요하면 해당 디렉터리도 수동 삭제 후 재기동
```

---

## 2. 기존 스택만 내리기

```bash
cd ~/my-msa-project-new
docker compose down
```

실행 중 컨테이너가 멈추고, compose 네트워크 등이 정리됩니다. **이미지는 아직 디스크에 남습니다.**

---

## 3. Git 원격을 새 저장소로 맞추기(선택)

이미 이 폴더가 다른 원격이면:

```bash
cd ~/my-msa-project-new
git remote -v
git remote set-url origin https://github.com/MinKyeom/MSA-Standard-Template.git
git fetch origin
git checkout main   # 또는 기본 브랜치명
git pull --ff-only origin main
```

처음 이 경로에만 둘 거면 `git clone` 으로 새로 받아도 됩니다. CI의 `DEPLOY_PATH` / 기본값 `~/저장소이름` 과 **경로·이름**을 맞추세요.

---

## 4. `.env` 를 GHCR 기준으로 수정

최소 변경:

```env
DOCKER_IMAGE_PREFIX=ghcr.io/minkyeom/msa-standard-template
IMAGE_TAG=latest
```

실제 배포는 Actions 가 `IMAGE_TAG` 를 **커밋 SHA**로 덮어씁니다. 수동으로 맞출 때는 GitHub Packages 에 올라간 태그(예: SHA)를 넣습니다.

GHCR 이미지가 **Private** 이면:

```bash
echo "GITHUB_PAT" | docker login ghcr.io -u MinKyeom --password-stdin
```

---

## 5. 새 이미지로 올리기

```bash
cd ~/my-msa-project-new
export DOCKER_IMAGE_PREFIX=ghcr.io/minkyeom/msa-standard-template
export IMAGE_TAG=<원하는_태그_또는_main_빌드_SHA>
docker compose pull
docker compose up -d --pull always --force-recreate --remove-orphans
```

`docker compose ps` 에서 이미지 이름이 `ghcr.io/minkyeom/msa-standard-template/...` 형태인지 확인합니다.

---

## 6. 예전 로컬 빌드 이미지·캐시 정리(디스크 최적화)

**주의:** 아래는 **사용 중이 아닌** 이미지/빌드 캐시를 지웁니다. `up` 직후 필요한 레이어는 다시 pull 됩니다.

### 사용하지 않는 이미지

```bash
docker image prune -a -f
```

(더 보수적으로: `docker image prune -f` 만 — dangling 만 삭제)

### 빌드 캐시(BuildKit)

```bash
docker builder prune -a -f
```

### 한 번에(네트워크·중지된 컨테이너 등 포함, 볼륨은 기본 제외)

```bash
docker system prune -a -f
```

**볼륨까지** 지우면 DB 데이터가 날아갈 수 있음:

```bash
docker system prune -a --volumes -f
```

운영 DB가 있는 서버에서는 **`--volumes` 사용 비권장**.

---

## 7. CI/CD 와 맞추기

### 이미지는 어디서 빌드되나

- **맥/PC 로컬 Docker**에서 빌드한 이미지는 **자동으로 서버에 가지 않습니다.**
- **`git push` → GitHub Actions 러너(클라우드)**에서 `docker compose build`·`push` 로 **GHCR**에 올라가고, 배포 job이 서버에서 **같은 커밋 SHA 태그**로 `pull` · `up` 합니다.
- 따라서 “최신 이미지로 돌리기” = **코드 수정 후 `main`에 push**(또는 Actions에서 **Re-run**).

### 배포 후 서버에서 디스크·캐시만 정리

프로젝트 루트(예: `~/MSA-Standard-Template`)에서:

```bash
bash scripts/server-docker-cleanup.sh
# 스택을 잠시 내리고 예전 이미지까지 비우려면:
bash scripts/server-docker-cleanup.sh --down-first --aggressive
```

`--aggressive` 는 **다른 Docker 프로젝트의 미사용 이미지**도 지울 수 있으니, 공유 서버면 주의하세요. **볼륨(DB 데이터)** 은 이 스크립트가 건드리지 않습니다.

### 워크플로 동작 요약

`main` 에 push 하면 빌드·푸시 후 서버에서 `git pull` · `.env`에 `IMAGE_TAG=커밋SHA` 반영 · `compose pull` · **`up --pull always --force-recreate`** 를 실행합니다.  
서버 경로가 **그 저장소 clone**이고 Secrets(`HOST`, `USERNAME`, `KEY`, `ENV_VARS`, 필요 시 `DEPLOY_PATH`)가 맞으면 이후는 자동입니다.

---

## 8. 참고: `unhealthy` 컨테이너

게이트웨이·Kafka·Java 서비스 등은 기동 지연으로 잠시 `unhealthy`일 수 있습니다.  
지속되면 `docker compose logs api-gateway` 등으로 원인을 보는 것이 별도 작업입니다.
