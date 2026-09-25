from fastapi import APIRouter, HTTPException

from app.db.mongo import db

router = APIRouter()


@router.get("/cases/{case_id}/artifacts")
async def list_artifacts(case_id: str):
    sample = [
        {
            "id": "art-001",
            "case_id": case_id,
            "artifact_type": "document",
            "file_format": "pdf",
            "integrity_score": 0.91,
            "entropy_score": 0.42,
            "classification_tags": ["finance", "internal"],
            "priority_score": 88,
            "recovered_timestamp": "2026-09-25T10:44:00Z",
            "metadata": {"name": "ledger_2024.pdf", "size": 210000},
        },
        {
            "id": "art-002",
            "case_id": case_id,
            "artifact_type": "image",
            "file_format": "jpg",
            "integrity_score": 0.74,
            "entropy_score": 0.61,
            "classification_tags": ["evidence", "photo"],
            "priority_score": 67,
            "recovered_timestamp": "2026-09-25T10:45:00Z",
            "metadata": {"name": "scene_17.jpg", "size": 890000},
        },
    ]
    return sample


@router.get("/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str):
    if artifact_id == "art-001":
        return {
            "id": artifact_id,
            "artifact_type": "document",
            "file_format": "pdf",
            "integrity_score": 0.91,
            "integrity_breakdown": {"header_valid": True, "footer_valid": True, "entropy": 0.42, "parse_depth": 0.87},
            "content_preview": "Recovered ledger summary indicates outbound transfers and associated accounting entries.",
            "related_fragment_ids": ["frag-101", "frag-204"],
        }
    raise HTTPException(status_code=404, detail="Artifact not found")


@router.get("/artifacts/{artifact_id}/fragments")
async def get_fragments(artifact_id: str):
    return {
        "artifact_id": artifact_id,
        "fragments": [
            {"id": "frag-101", "size": 2048, "hash": "9bc1d2", "cluster_id": "cluster-a"},
            {"id": "frag-204", "size": 3150, "hash": "d5f0aa", "cluster_id": "cluster-a"},
        ],
    }
