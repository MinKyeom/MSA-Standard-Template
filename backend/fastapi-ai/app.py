from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import re
import traceback

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import SystemMessage, HumanMessage

from db_utils import init_db, save_info, retrieve_context
from memory import set_session_data, get_session_data, append_chat_history, get_chat_history, clear_session
from schemas import ChatPayload, AgentActionSchema
from prompts.chat_prompts import GITHUB_INFO, AGENT_SYSTEM_TEMPLATE


def _cors_allowed_origins():
    """
    게이트웨이와 동일한 CORS_ALLOWED_ORIGINS(.env, 쉼표 구분)를 사용.
    미설정 시 로컬 개발 Origin 만 허용(운영은 반드시 .env 에 도메인 나열).
    """
    raw = (os.getenv("CORS_ALLOWED_ORIGINS") or "").strip()
    out = [o.strip() for o in raw.split(",") if o.strip()]
    for d in (
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ):
        if d not in out:
            out.append(d)
    return out


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _parse_agent_json(raw: str) -> AgentActionSchema | None:
    """Groq 응답이 마크다운/앞뒤 문장을 섞어도 첫 JSON 객체를 꺼내 검증한다."""
    t = _strip_code_fence(raw)
    start = t.find("{")
    if start < 0:
        return None
    depth = 0
    end = -1
    for i, c in enumerate(t[start:], start=start):
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end < 0:
        return None
    try:
        data = json.loads(t[start:end])
        return AgentActionSchema.model_validate(data)
    except Exception:
        return None


def _language_instruction(message: str) -> str:
    """사용자 입력이 라틴 위주면 영어, 그 외는 한국어로 답하도록 지시."""
    letters = [c for c in message if c.isalpha()]
    if not letters:
        return (
            "Match the user's language (Korean or English). "
            "If the message is too short to tell, prefer Korean."
        )
    ascii_ratio = sum(1 for c in letters if ord(c) < 128) / len(letters)
    if ascii_ratio >= 0.85:
        return "The user is writing primarily in English. You MUST respond entirely in natural English."
    return "The user is writing primarily in Korean. You MUST respond entirely in natural Korean."


# 초기화
init_db()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 환경 변수 및 설정
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")  # 기본값 1234

try:
    _groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    llm = (
        ChatGroq(model=_groq_model, groq_api_key=GROQ_API_KEY, temperature=0.2)
        if GROQ_API_KEY
        else None
    )
except Exception as e:
    print(f"LLM 로드 에러: {e}")
    llm = None


@app.get("/chat/health")
@app.get("/health")
async def health():
    """Gateway/로드밸런서 헬스체크용. LLM 설정 여부만 반환."""
    return {"status": "ok", "llm_configured": llm is not None}


@app.post("/chat")
async def chat_endpoint(payload: ChatPayload):
    session_id = payload.session_id
    msg = payload.message
    session = get_session_data(session_id)

    # 1. 비밀번호 인증 단계 처리
    if session.get("is_verifying"):
        if msg.strip() == ADMIN_PASSWORD:
            pending = session.get("pending_data")
            if pending:
                save_info(pending["category"], pending["value"])
                response_text = f"✅ 본인 확인 완료! 요청하신 내용을 기억했습니다: {pending['value']}"
            else:
                response_text = "✅ 본인 확인이 완료되었습니다. 이제 자유롭게 이용하세요."

            session.update({"user_verified": True, "is_verifying": False, "pending_data": None})
            set_session_data(session_id, session)
        else:
            low = msg.strip().lower()
            if "취소" in msg or low in ("cancel", "abort", "stop"):
                session.update({"is_verifying": False, "pending_data": None})
                set_session_data(session_id, session)
                response_text = "인증이 취소되었습니다."
            else:
                response_text = "❌ 비밀번호가 틀렸습니다. 다시 입력하시거나 '취소'를 입력해주세요."

        append_chat_history(session_id, "AI", response_text)
        return {"response": response_text}

    # 2. 일반 대화 및 정보 조회 처리
    if not llm:
        return {"response": "챗봇 엔진(GROQ API)이 설정되지 않았습니다. GROQ_API_KEY를 확인해 주세요."}

    history_list = get_chat_history(session_id)
    history_text = "\n".join(history_list) if history_list else "이전 대화 없음"
    context_text = retrieve_context(msg)  # DB 정보 우선 참조

    lang_instruction = _language_instruction(msg)
    agent_prompt = PromptTemplate(
        template=AGENT_SYSTEM_TEMPLATE,
        input_variables=["history", "context", "message", "github_info", "lang_instruction"],
    )

    try:
        raw = (agent_prompt | llm | StrOutputParser()).invoke(
            {
                "history": history_text,
                "context": context_text,
                "message": msg,
                "github_info": GITHUB_INFO,
                "lang_instruction": lang_instruction,
            }
        )
        action_result = _parse_agent_json(raw)

        if action_result is None:
            raise ValueError("structured JSON parse failed")

        if action_result.action == "save":
            cat = (action_result.category or "general").strip() or "general"
            val = (action_result.value or "").strip()
            if not val:
                response_text = "저장할 내용이 비어 있습니다. 다시 말씀해 주세요."
            elif session.get("user_verified"):
                save_info(cat, val)
                response_text = f"✅ (기억됨) {val}"
            else:
                session.update(
                    {
                        "is_verifying": True,
                        "pending_data": {"category": cat, "value": val},
                    }
                )
                set_session_data(session_id, session)
                response_text = "🔒 중요 정보를 저장하려면 본인 인증이 필요합니다. 비밀번호를 입력해주세요."
        else:
            response_text = (action_result.value or "").strip() or "답변을 생성할 수 없습니다."

        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", response_text)
        return {"response": response_text}

    except Exception:
        traceback.print_exc()
        try:
            sys_msg = SystemMessage(
                content=(
                    "You are MinKowskiM's site assistant. Answer clearly and concisely. "
                    + lang_instruction
                )
            )
            human_msg = HumanMessage(
                content=(
                    f"[Context]\n{context_text}\n\n[History]\n{history_text}\n\n[User]\n{msg}"
                )
            )
            out = llm.invoke([sys_msg, human_msg])
            response_text = out.content if hasattr(out, "content") else str(out)
        except Exception:
            response_text = (
                "요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
            )

        append_chat_history(session_id, "User", msg)
        append_chat_history(session_id, "AI", response_text)
        return {"response": response_text}


@app.post("/clear")
async def clear_chat(payload: ChatPayload):
    clear_session(payload.session_id)
    return {"message": "기록이 초기화되었습니다."}


# Gateway가 /chat/** 를 그대로 전달하므로 /chat/clear 요청도 처리 (동일 동작)
@app.post("/chat/clear")
async def clear_chat_under_chat(payload: ChatPayload):
    clear_session(payload.session_id)
    return {"message": "기록이 초기화되었습니다."}
