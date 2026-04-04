from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class ChatPayload(BaseModel):
    session_id: str = "user_001"
    message: str


class AgentActionSchema(BaseModel):
    action: Literal["save", "query", "none"]
    category: Optional[str] = Field(default=None, description="정보 카테고리 (예: interest, study).")
    value: Optional[str] = Field(default=None, description="저장할 내용 또는 답변.")

    @field_validator("action", mode="before")
    @classmethod
    def normalize_action(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v