# MSA Blog Platform — Standard Template

<p align="center">
  <b>Documentation</b><br/>
  <a href="README.ko.md">한국어 (Korean)</a>
  &nbsp;·&nbsp;
  <a href="README.en.md">English</a>
</p>

---

Spring Cloud Gateway 기반 **마이크로서비스 블로그** 템플릿입니다. Fork 후 환경 변수만 맞추면 Docker로 전체 스택을 띄울 수 있고, GitHub Actions로 **GHCR 빌드·배포**까지 연결할 수 있습니다.

A **microservices blog** template built around **Spring Cloud Gateway**. Fork, set environment variables, and run the full stack with Docker; optionally wire **GitHub Actions → GHCR → your server**.

### 30-second start

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git && cd YOUR_REPO
bash scripts/local-up.sh
```

- App: **http://localhost:3000** · Gateway: **http://localhost:8085**

자세한 설명·구조·API·배포는 위 언어 링크에서 확인하세요.  
For architecture, API routes, CI/CD, and fork instructions, open **Korean** or **English** above.
