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

CI는 **Nginx를 설치·설정하지 않습니다.** 컨테이너만 `pull` · `up` 합니다. 도메인·HTTPS는 **서버 호스트의 Nginx**(또는 다른 리버스 프록시)에서 아래 절차로 맞춥니다.

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
| `nginx/msa-project.conf.template` | `${NGINX_HTTP_PORT}` 같은 **플레이스홀더**만 있는 원본. 그대로는 nginx에 넣지 않음. |
| `nginx/.env.nginx.example` | 치환에 쓸 변수 예시. 복사해 `nginx/.env.nginx` 로 쓰면 됨(`.gitignore` 권장). |
| `scripts/render-nginx.sh` | `envsubst`로 템플릿을 읽어 **실제 nginx 문법의 한 파일**로 출력. |
| 출력 기본값 | `nginx/msa-project.rendered.conf` (저장소 루트 `.gitignore`에 있음) |

**원리:** 도메인·IP·인증서 경로는 환경마다 다르므로 Git에는 **템플릿 + 예시 env**만 두고, 서버(또는 로컬)에서 `nginx/.env.nginx` 를 채운 뒤 렌더 → 생성된 **단일 conf**만 `/etc/nginx/sites-available/` 로 복사합니다.

---

## 4. 수행 순서 (Ubuntu 서버 예시)

### 4.1 사전 준비

1. `docker compose up -d` 로 **프론트(3000)·게이트웨이(8085)** 가 호스트의 `127.0.0.1` 에 떠 있는지 확인(compose 기본 포트 publish 가정).
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
