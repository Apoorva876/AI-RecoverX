from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile, status

from app.db.mongo import db
from app.services.forensic_analysis import analyze_uploaded_file, build_case_analysis_response

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

router = APIRouter()


@router.post("")
async def create_case(payload: dict):
    case_doc = {
        "user_id": payload.get("user_id", "demo-user"),
        "title": payload.get("title", "New Case"),
        "source_type": payload.get("source_type", "disk_image"),
        "status": "uploaded",
        "description": payload.get("description", "Corrupted source uploaded for forensic analysis."),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    result = await db.cases.insert_one(case_doc)
    return {"id": str(result.inserted_id), **case_doc}


@router.get("")
async def list_cases():
    cases = []
    async for case in db.cases.find({}).sort("created_at", -1):
        cases.append({
            "id": str(case["_id"]),
            "title": case.get("title", "Unnamed case"),
            "source_type": case.get("source_type", "disk_image"),
            "status": case.get("status", "uploaded"),
            "created_at": case.get("created_at", ""),
            "updated_at": case.get("updated_at", ""),
            "user_id": case.get("user_id", "demo-user"),
        })
    return cases


@router.get("/{case_id}")
async def get_case(case_id: str):
    case = await db.cases.find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"id": str(case["_id"]), **case}


@router.delete("/{case_id}")
async def delete_case(case_id: str):
    result = await db.cases.delete_one({"_id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"deleted": True, "case_id": case_id}


@router.post("/{case_id}/upload")
async def upload_case(
    case_id: str,
    payload: dict | None = Body(default=None),
    file: UploadFile | None = File(default=None),
    source_type: str = Form("disk_image"),
    corruption_level: str = Form("medium"),
    file_name: str | None = Form(default=None),
):
    payload = payload or {}
    final_file_name = file_name or payload.get("file_name") or (file.filename if file else "damaged_source.img")
    source_type = source_type or payload.get("source_type", "disk_image")
    corruption_level = corruption_level or payload.get("corruption_level", "medium")
    uploaded_analysis = None

    if file is not None:
        file_bytes = await file.read()
        safe_name = file.filename or "uploaded_evidence.bin"
        uploaded_analysis = analyze_uploaded_file(
            file_bytes=file_bytes,
            file_name=safe_name,
            source_type=source_type,
            corruption_level=corruption_level,
            upload_dir=UPLOAD_DIR,
        )
        final_file_name = safe_name

    await db.cases.update_one({"_id": case_id}, {"$set": {"status": "processing", "updated_at": datetime.utcnow().isoformat()}})
    return build_case_analysis_response(case_id, final_file_name, source_type, corruption_level, uploaded_analysis=uploaded_analysis)


@router.post("/{case_id}/process")
async def process_case(
    case_id: str,
    payload: dict | None = Body(default=None),
    source_type: str = Form("disk_image"),
    corruption_level: str = Form("medium"),
    file_name: str | None = Form(default=None),
):
    payload = payload or {}
    final_file_name = file_name or payload.get("file_name", "damaged_source.img")
    source_type = source_type or payload.get("source_type", "disk_image")
    corruption_level = corruption_level or payload.get("corruption_level", "medium")

    await db.cases.update_one({"_id": case_id}, {"$set": {"status": "processed", "updated_at": datetime.utcnow().isoformat()}})
    return build_case_analysis_response(case_id, final_file_name, source_type, corruption_level)


@router.get("/{case_id}/status")
async def case_status(case_id: str):
    case = await db.cases.find_one({"_id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"case_id": case_id, "status": case.get("status", "uploaded"), "progress": 92, "summary": "Fragment carving, clustering, scoring and prioritization complete."}
