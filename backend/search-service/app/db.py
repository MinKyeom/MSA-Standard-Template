# pgvector 스키마 및 연결
import psycopg2
from pgvector.psycopg2 import register_vector
from contextlib import contextmanager
from app.config import (
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    EMBEDDING_DIM,
)

def _connect_raw():
    """vector 확장 로드 없이 연결 (init_db에서 확장 생성 시 사용)."""
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    )


def get_conn():
    conn = _connect_raw()
    register_vector(conn)
    return conn


@contextmanager
def get_cursor():
    conn = get_conn()
    try:
        yield conn.cursor()
        conn.commit()
    finally:
        conn.close()

# def init_db():
#     """pgvector 확장 및 post_embeddings 테이블 생성. 확장을 먼저 생성한 뒤 register_vector 사용."""
#     # set_session(autocommit)은 트랜잭션 밖에서만 가능 — with conn: 사용 시 트랜잭션 진입하므로
#     # 연결만 열고 autocommit 설정 후 커서로 실행하고 수동으로 닫기
#     conn = _connect_raw()
#     try:
#         conn.autocommit = True
#         with conn.cursor() as cur:
#             cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
#     finally:
#         conn.close()

#     conn2 = get_conn()
#     try:
#         conn2.autocommit = True
#         with conn2.cursor() as cur:
#             cur.execute("""
#                 CREATE TABLE IF NOT EXISTS post_embeddings (
#                     id BIGSERIAL PRIMARY KEY,
#                     post_id BIGINT NOT NULL UNIQUE,
#                     title TEXT,
#                     content_snippet TEXT,
#                     embedding vector(%s) NOT NULL,
#                     created_at TIMESTAMPTZ DEFAULT NOW()
#                 );
#                 CREATE INDEX IF NOT EXISTS idx_post_embeddings_embedding
#                 ON post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
#             """ % EMBEDDING_DIM)
#     finally:
#         conn2.close()
#     return True

def init_db():
    """pgvector 확장 및 post_embeddings 테이블 생성."""
    # 1. 확장 생성 (항상 _connect_raw 사용)
    conn = _connect_raw()
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    finally:
        conn.close()

    # 2. 테이블 및 인덱스 생성
    # get_conn() 대신 _connect_raw()를 사용해야 autocommit 설정 시 오류가 안 납니다.
    conn2 = _connect_raw() 
    try:
        conn2.autocommit = True
        with conn2.cursor() as cur:
            # SQL 문법 내의 %s는 직접 문자열 포맷팅으로 넣거나, 
            # execute의 두 번째 인자로 전달해야 합니다. (여기서는 테이블 구조이므로 f-string 추천)
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS post_embeddings (
                    id BIGSERIAL PRIMARY KEY,
                    post_id BIGINT NOT NULL UNIQUE,
                    title TEXT,
                    content_snippet TEXT,
                    embedding vector({EMBEDDING_DIM}) NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_post_embeddings_embedding
                ON post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
            """)
    finally:
        conn2.close()
    return True

def upsert_embedding(post_id: int, title: str, content_snippet: str, embedding: list):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO post_embeddings (post_id, title, content_snippet, embedding)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (post_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    content_snippet = EXCLUDED.content_snippet,
                    embedding = EXCLUDED.embedding,
                    created_at = NOW();
            """, (post_id, title or "", (content_snippet or "")[:2000], embedding))
        conn.commit()


def delete_embedding(post_id: int):
    """포스트 삭제 시 검색 인덱스에서 제거."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM post_embeddings WHERE post_id = %s", (post_id,))
        conn.commit()


def get_embedding_by_post_id(post_id: int):
    """연관글 검색용: 해당 post_id의 embedding 벡터 반환 (없으면 None)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT embedding::text FROM post_embeddings WHERE post_id = %s", (post_id,))
            row = cur.fetchone()
    if not row:
        return None
    # pgvector가 text로 반환될 수 있음 — 파싱
    s = row[0]
    if isinstance(s, str) and s.startswith("["):
        import json
        return json.loads(s)
    return list(s) if hasattr(s, "__iter__") and not isinstance(s, str) else None


def search_similar(query_embedding: list, limit: int = 10, exclude_post_id: int = None):
    """코사인 유사도로 유사 게시글 검색. exclude_post_id 있으면 해당 글 제외 (연관글용)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            if exclude_post_id is not None:
                cur.execute("""
                    SELECT post_id, title, content_snippet, 1 - (embedding <=> %s::vector) AS score
                    FROM post_embeddings
                    WHERE post_id != %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """, (query_embedding, exclude_post_id, query_embedding, limit))
            else:
                cur.execute("""
                    SELECT post_id, title, content_snippet, 1 - (embedding <=> %s::vector) AS score
                    FROM post_embeddings
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                """, (query_embedding, query_embedding, limit))
            return cur.fetchall()
