from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(..., min_length=8)

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if '@' not in value:
            raise ValueError('Email must include a valid address format')
        return value


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        value = value.strip().lower()
        if '@' not in value:
            raise ValueError('Email must include a valid address format')
        return value


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["investigator", "admin"] = "investigator"

    model_config = ConfigDict(from_attributes=True)


class CaseCreate(BaseModel):
    title: str
    source_type: Literal["disk_image", "network_share", "usb_drive"] = "disk_image"
    description: Optional[str] = None


class CaseResponse(BaseModel):
    id: str
    title: str
    source_type: str
    status: str = "uploaded"
    created_at: str
    updated_at: str
    user_id: str


class Artifact(BaseModel):
    id: str
    case_id: str
    artifact_type: str
    file_format: str
    integrity_score: float
    entropy_score: float
    classification_tags: List[str]
    priority_score: float
    recovered_timestamp: str
    metadata: Dict[str, Any] = {}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    cited_artifacts: List[str] = []
    timestamp: str


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    cited_artifacts: List[str] = []


class ReportSummary(BaseModel):
    id: str
    case_id: str
    summary_text: str
    generated_at: str
    export_url: str | None = None
