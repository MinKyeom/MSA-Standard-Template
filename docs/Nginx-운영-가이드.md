# Nginx 운영 가이드 (/etc/nginx 와 저장소 템플릿)

## 1. Git push 직후 CI/CD를 바로 시도할 수 있는지

저장소 상태만 맞으면 **바로 시도 가능**합니다. 다음을 만족하는지 확인하세요.

| 조건 | 설명 |
|------|------|
| 브랜치 | `main` 또는 `master` 에 push |
| Secret `ENV_VARS` | 비어 있으면 **빌드 job 실패** — `.env` 전체를 등록 |
| Secret `HOST`, `USERNAME`, `KEY` | 배포까지 하려면 필수 |
| 서버 | 배포 경로( `DEPLOY_PATH` 또는 `~/저장소이름` )에 **이미 `git clone` 된 저장소** |
| GHCR | 이미지가 private이면 서버에서 `docker login ghcr.io` |
| 서버 | Docker / Docker Compose v2 / Git 설치 |

CI는 **호스트에 Nginx 패키지를 설치하지는 않습니다.** 대신 Compose **`reverse-proxy` 서비스(프로필 `edge`)** 가 **80/443** 을 열고, 호스트의 **`/etc/letsencrypt` 를 읽기 전용으로 마운트**해 TLS를 종료합니다. 서버 `.env`(또는 `ENV_VARS`)에 **`COMPOSE_PROFILES=edge`** 가 필요합니다(Actions 가 없으면 배포용 `.env` 에 `edge` 를 붙입니다). **`PRIMARY_SERVER_NAMES`·`SSL_*`** 는 명시하지 않아도, **`NEXT_PUBLIC_SITE_URL`/`FRONTEND_URL`**(또는 Actions Variables 의 `PUBLIC_SITE_URL` → `merge-ci-env-overrides.sh`)로 **reverse-proxy 컨테이너 entrypoint** 가 Let’s Encrypt 경로를 맞춥니다. 다만 **명시해 두는 편이 가장 확실**합니다.

**최초 전환 시:** 호스트에서 `sudo systemctl stop nginx` · `sudo systemctl disable nginx` 로 **기존 80/443 점유를 해제**한 뒤 `docker compose up -d` 하세요. 인증서는 기존과 같이 호스트에서 **certbot** 등으로 갱신하면 됩니다(컨테이너는 마운트로 즉시 반영).

**배포(CI) 시 `address already in use` (80/443):** 호스트 **nginx**(또는 apache2)가 아직 떠 있으면 Docker `msa-nginx`가 바인딩하지 못합니다. GitHub Actions SSH 배포는 `scripts/free-host-ports-for-msa-nginx.sh` 로 nginx/apache2 를 먼저 중지합니다. **배포용 SSH 사용자**에 `sudo systemctl stop nginx` 등이 가능해야 합니다(`sudoers` NOPASSWD). 수동 배포 전에는 `./scripts/free-host-ports-for-msa-nginx.sh` 를 실행하세요.

**레거시:** 호스트 `/etc/nginx` 만 쓰는 방식은 아래 절차(템플릿·`render-nginx.sh`·`systemctl reload nginx`)로 유지할 수 있습니다. 템플릿 원본은 `nginx/templates/*.template` 입니다.

---

## 2. Ubuntu에서 Nginx가 보통 쓰는 경로 (`/etc/nginx`)

| 경로 | 역할 |
|------|------|
| `/etc/nginx/nginx.conf` | 전역 설정 |
| `/etc/nginx/sites-available/` | 사이트별 설정 **파일 보관** |
| `/etc/nginx/sites-enabled/` | `sites-available` 로의 **심볼릭 링크** — 여기만 실제로 로드 |

즉 **“실제로 동작하는 설정”은 `/etc` 아래**에 두는 것이 표준입니다. 공개 저장소에는 **개인 도메인·인증서가 박힌 단일 설정 파일**을 두지 않습니다. **도메인·인증서·업스트림이 바뀔 때마다** 손으로 고치기 어렵기 때문에, 아래 **템플릿 + 스크립트**만 제공합니다.

---

## 3. 저장소 쪽 구조 (무엇이 무엇인지)

| 경로 | 역할 |
|------|------|
| `nginx/templates/10-main.conf.template` · `20-dev.conf.template` | `${PRIMARY_SERVER_NAMES}` 등 **플레이스홀더** 원본. Docker `reverse-proxy` 가 기동 시 `envsubst` 처리. |
| `nginx/msa-project.conf.template` | 위 분리 구조 안내용(짧은 주석). |
| `nginx/.env.nginx.example` | 치환에 쓸 변수 예시. 복사해 `nginx/.env.nginx` 로 쓰면 됨(`.gitignore` 권장). |
| `scripts/render-nginx.sh` | `envsubst`로 템플릿을 읽어 **실제 nginx 문법의 한 파일**로 출력. |
| 출력 기본값 | `nginx/msa-project.rendered.conf` (저장소 루트 `.gitignore`에 있음) |

**원리:** 도메인·IP·인증서 경로는 환경마다 다르므로 Git에는 **템플릿 + 예시 env**만 두고, 서버(또는 로컬)에서 `nginx/.env.nginx` 를 채운 뒤 렌더 → 생성된 **단일 conf**만 `/etc/nginx/sites-available/` 로 복사합니다.

---

## 4. 수행 순서 (Ubuntu 서버 예시)

### 4.1 사전 준비

1. **호스트 전용 Nginx**를 쓸 때: `docker compose` + `docker-compose.local.yml` 로 **프론트(3000)·게이트웨이(8085)** 가 호스트에 publish 되는지 확인하거나, **Docker `reverse-proxy`만** 쓸 때는 컨테이너 간 네트워크로만 붙습니다.
2. `sudo apt-get install -y nginx gettext-base`
3. Let’s Encrypt 사용 시: `certbot` 으로 인증서 발급 후  
   `/etc/letsencrypt/options-ssl-nginx.conf`, `ssl-dhparams.pem` 존재 여부 확인(없으면 `certbot --nginx` 등으로 생성).

### 4.2 변수 파일 만들기

```bash
cd /path/to/my-msa-project-new
cp nginx/.env.nginx.example nginx/.env.nginx
# 편집: PRIMARY_SERVER_NAMES, SSL_*, UPSTREAM_GATEWAY=127.0.0.1:8085, UPSTREAM_FRONTEND=127.0.0.1:3000 등
```

`nginx/.env.nginx` 는 비밀은 거의 없지만 **서버별 경로**이므로 Git에 올리지 않는 것을 권장합니다.

### 4.3 렌더

```bash
chmod +x scripts/render-nginx.sh
./scripts/render-nginx.sh nginx/.env.nginx
# → nginx/msa-project.rendered.conf 생성
```

인스톨 경로로 바로 쓰려면:

```bash
./scripts/render-nginx.sh nginx/.env.nginx /tmp/msa-nginx.conf
sudo mv /tmp/msa-nginx.conf /etc/nginx/sites-available/msa-project.conf
```

### 4.4 활성화 및 리로드

```bash
sudo ln -sf /etc/nginx/sites-available/msa-project.conf /etc/nginx/sites-enabled/msa-project.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. CI/CD와의 관계

1. **push** → Actions 가 이미지 빌드·GHCR 푸시 → 서버에서 `git pull` · `docker compose pull` · `up`.
2. **Nginx 설정 변경**은 Git의 `msa-project.conf.template` 또는 `nginx/.env.nginx` 를 고친 뒤, 서버에서 **다시 `render-nginx.sh` 실행 → `/etc` 로 복사 → `nginx -t` · reload** 해야 반영됩니다. (원하면 나중에 SSH 배포 스크립트에 이 두 줄을 추가할 수 있음.)

---

## 6. 자주 나는 문제

| 증상 | 확인 |
|------|------|
| `envsubst: command not found` | `sudo apt-get install -y gettext-base` |
| `nginx -t` 실패, ssl include | certbot 실행 여부, `SSL_CERT_PATH` 경로 |
| 502 | Docker 가 `127.0.0.1:3000` / `8085` 에 떠 있는지, `UPSTREAM_*` 와 일치하는지 |
| HTTP→HTTPS 리다이렉트 루프 | `X-Forwarded-Proto`·프록시 체인 |

---

## 7. 관련 파일

- `scripts/render-nginx.sh`
- `nginx/msa-project.conf.template`
- `nginx/.env.nginx.example`
- `.github/workflows/deploy.yml` (Nginx 미포함)
