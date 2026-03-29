# 1. 빌드 스테이지
FROM python:3.10-slim AS builder
WORKDIR /app

# Groq API 및 외부 통신용 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# 2. 실행 스테이지
FROM python:3.10-slim
WORKDIR /app
# 라이브러리 복사
COPY --from=builder /install /usr/local
COPY . .
# 데이터 저장 폴더 생성 및 권한 부여 (SQLite DB 용)
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]