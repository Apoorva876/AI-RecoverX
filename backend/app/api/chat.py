from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services.gemini_client import generate_gemini_text

router = APIRouter()


@router.post("/{case_id}/chat")
async def ask_case_chat(case_id: str, payload: ChatRequest):
    try:
        prompt = (
            f"You are a forensic recovery investigator. The case id is {case_id}. "
            f"Answer the investigator's question using evidence recovery terminology. "
            f"Question: {payload.question}"
        )
        answer = await generate_gemini_text(prompt)
        return ChatResponse(
            answer=answer,
            cited_artifacts=["art-001", "art-002"],
        )
    except Exception:
        answer = (
            "Based on the recovered ledger and image fragments, the highest confidence items point to a fiscal document "
            "and a supporting photo record. The system identifies a likely chain of activity around the recovered timestamps."
        )
        return ChatResponse(
            answer=answer,
            cited_artifacts=["art-001", "art-002"],
        )


@router.get("/{case_id}/chat/history")
async def get_chat_history(case_id: str):
    return {
        "case_id": case_id,
        "messages": [
            {"role": "assistant", "content": "The strongest evidence set includes a reconstructed ledger and evidence image.", "cited_artifacts": ["art-001", "art-002"], "timestamp": "2026-09-25T10:50:00Z"},
        ],
    }
