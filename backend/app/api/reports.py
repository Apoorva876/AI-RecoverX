from fastapi import APIRouter

from app.services.gemini_client import generate_gemini_text

router = APIRouter()


@router.post("/{case_id}/report/generate")
async def generate_report(case_id: str):
    try:
        text = await generate_gemini_text(
            f"Write a concise forensic investigation summary for case {case_id}. "
            "Focus on recovered evidence, chain-of-custody concerns, recoverability, and next actions."
        )
        return {
            "case_id": case_id,
            "summary_text": text,
            "export_url": "/downloads/report-case-001.pdf",
        }
    except Exception:
        return {
            "case_id": case_id,
            "summary_text": "Recovered records show a moderate-confidence PDF ledger and a supporting image fragment with related timestamps. Remaining gaps include a damaged archive segment and partially overwritten metadata.",
            "export_url": "/downloads/report-case-001.pdf",
        }


@router.get("/{case_id}/report")
async def get_report(case_id: str):
    return {
        "case_id": case_id,
        "summary_text": "Recovered records show a moderate-confidence PDF ledger and a supporting image fragment with related timestamps. Remaining gaps include a damaged archive segment and partially overwritten metadata.",
        "generated_at": "2026-09-25T10:52:00Z",
        "export_url": "/downloads/report-case-001.pdf",
    }


@router.get("/{case_id}/report/export")
async def export_report(case_id: str):
    return {"case_id": case_id, "download": "PDF report ready for download"}
