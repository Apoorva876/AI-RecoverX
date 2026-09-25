# RecoverX — Forensic Recovery Copilot

RecoverX is designed around the problem statement: an AI-assisted forensic recovery solution that identifies, reconstructs, classifies, and prioritizes recoverable digital information from damaged, deleted, or partially corrupted storage data.

## What this project does

- Accepts a damaged or corrupted evidence source such as a disk image or USB dump
- Performs forensic-style analysis using a realistic recovery workflow
- Identifies likely recoverable artifacts
- Scores integrity and confidence
- Prioritizes the highest-value evidence items
- Returns a plain-English AI summary and next actions for investigators

## Backend workflow

1. User uploads a damaged source or evidence image.
2. The case is created and marked as processing.
3. The recovery engine analyzes likely fragment clusters and artifact quality.
4. The API returns a structured response with recoverable artifacts, confidence scores, and priority ranking.
5. The frontend displays the recovered evidence and investigator summary.

## Stack

- Frontend: React + Vite
- Backend: FastAPI
- Data: MongoDB-ready configuration with in-memory fallback for local demo mode
- AI reasoning: rule-based forensic scoring and structured result generation for demo scenarios

## Run the frontend

```bash
cd "C:/Users/anu20/Desktop/RecoverX"
npm install
npm run dev -- --host 0.0.0.0 --port 4173
```

Then open http://localhost:4173

## Run the backend

```powershell
cd "C:\Users\anu20\Desktop\RecoverX\backend"
"C:\Users\anu20\AppData\Local\Programs\Python\Python313\python.exe" -m pip install -r requirements.txt
"C:\Users\anu20\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Health check

```bash
curl http://localhost:8001/health
```

## Example forensic case response

The backend now returns a recovery-style payload like:

```json
{
  "case_id": "case_101",
  "status": "processed",
  "file_summary": {
    "original_name": "damaged_drive.img",
    "file_type": "disk_image",
    "corruption_level": "medium",
    "recoverability_score": 72
  },
  "recovered_items": [
    {
      "name": "ledger_2024_reconstructed.pdf",
      "type": "pdf",
      "confidence": 0.93,
      "recoverability": "high"
    }
  ],
  "priority_queue": [
    {
      "item": "ledger_2024_reconstructed.pdf",
      "reason": "highest integrity score and highest operational value"
    }
  ],
  "ai_summary": "The system recovered 3 likely artifacts..."
}
```

## MongoDB

```bash
docker compose up -d mongo
```

The API is configured to target MongoDB at `mongodb://localhost:27017` by default.
