# Search Service — FastAPI + sentence-transformers (all-MiniLM-L6-v2) + pgvector
# 메모리 제한 256MB; 모델 로딩 시 일시적으로 더 사용 가능하므로 스왑 허용 권장
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 사전 다운로드 (빌드 시 한 번만)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY . .
EXPOSE 8010

# 메모리 절약: 1 worker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8010", "--workers", "1"]
