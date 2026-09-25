# Forensic Recovery Copilot — Project Specification

## 1. Project Overview

**Problem Statement:** Design and develop an AI-assisted data recovery solution that identifies, reconstructs, classifies, and prioritizes recoverable digital information from damaged, deleted, or partially corrupted storage data — going beyond simple file recovery by determining relationships between fragments, assessing data integrity, and helping investigators understand what can realistically be restored.

**Solution Summary:** Forensic Recovery Copilot is an AI reasoning layer built on top of standard low-level file-carving tools (PhotoRec / bulk_extractor). Raw recovered fragments are clustered, scored for integrity, classified by type/sensitivity, and made explorable through an investigator-facing dashboard with a RAG-powered Q&A assistant that explains what was recovered, how confident the system is, and what evidence gaps remain.

**Target Users:** Digital forensics investigators, incident response teams, IT security analysts, and data recovery service providers.

**Core Differentiators:**
- Confidence-scored recovery (not just binary recovered/not-recovered)
- Semantic fragment stitching using embeddings + LLM reasoning
- Natural-language investigator assistant over recovered evidence
- Auto-generated plain-English recovery reports

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Low-level carving | PhotoRec / bulk_extractor / Scalpel (CLI, invoked as subprocess) |
| Backend | Python (FastAPI) |
| AI/ML | sentence-transformers (embeddings), Groq/OpenAI API (LLM reasoning), scikit-learn (clustering) |
| Integrity scoring | scipy (entropy), Pillow / python-docx / PyPDF2 (format validation) |
| Vector store | FAISS or Chroma |
| Database | MongoDB (metadata, reports, sessions) |
| Frontend | React + Tailwind CSS (or Streamlit for rapid demo) |
| Auth | JWT-based session auth |
| File storage | Local filesystem / S3-compatible bucket for recovered artifacts |
| Deployment (demo) | Docker Compose, local host |

---

## 3. Core Features

1. **Disk/Image Ingestion** — Upload a disk image or point to a corrupted storage source.
2. **Automated Fragment Carving** — Run existing recovery tools to extract raw fragments.
3. **Fragment Clustering & Reconstruction** — Group related fragments (same file/document/table) using embeddings + semantic stitching.
4. **Integrity & Corruption Scoring** — Per-artifact confidence score (entropy, header/footer validity, format parse depth).
5. **Classification & Prioritization** — Tag artifacts by type (docs, images, logs, credentials, DB records) and rank by sensitivity/relevance.
6. **Investigator Chat Assistant (RAG)** — Ask natural-language questions over recovered evidence; answers cite specific reconstructed artifacts.
7. **Timeline Reconstruction** — Correlate recovered artifact timestamps into an investigation timeline.
8. **Auto-Generated Recovery Report** — Plain-English summary of findings, confidence levels, and recovery gaps (exportable as PDF).
9. **Evidence Dashboard** — Visual overview of recovered artifacts, scores, and categories.

---

## 4. Authentication

- **Method:** Email + password with JWT access/refresh tokens.
- **Roles:** `investigator` (default), `admin` (manage users, view all cases).
- **Session Handling:** Access token (short-lived, 15 min) + refresh token (7 days), stored as HttpOnly cookies.
- **Case Isolation:** Each recovery session/case is scoped to the creating user or team; role-based access controls on case data.
- **Password Policy:** Hashed with bcrypt, minimum complexity enforced client + server side.
- (Optional stretch) SSO/OAuth for enterprise demo credibility.

---

## 5. Frontend Pages

1. **Login / Register**
2. **Dashboard** — list of past/active recovery cases, quick stats
3. **New Case / Upload** — upload disk image or point to source, configure scan
4. **Processing View** — live progress of carving → clustering → scoring → classification pipeline
5. **Case Results Overview** — grid/list of recovered artifacts with confidence score, type, thumbnail/preview
6. **Artifact Detail View** — full reconstructed content, integrity breakdown, related fragments
7. **Timeline View** — chronological visualization of recovered artifact activity
8. **Investigator Chat** — RAG-based Q&A interface scoped to the current case
9. **Report View / Export** — generated summary report, downloadable as PDF
10. **Settings / User Management** (admin only)

---

## 6. Backend Architecture

```
Client (React)
      │
      ▼
FastAPI Gateway (auth, routing, rate limiting)
      │
      ├── Ingestion Service ── invokes PhotoRec/bulk_extractor as subprocess
      │
      ├── Reconstruction Service ── embedding generation + fragment clustering
      │
      ├── Integrity Scoring Service ── entropy calc + format validators
      │
      ├── Classification Service ── artifact type tagging + prioritization
      │
      ├── RAG Service ── vector store retrieval + LLM query answering
      │
      └── Report Service ── aggregates case data → generates report
      │
      ▼
MongoDB (metadata/results) + Vector Store (FAISS/Chroma) + File Storage
```

- **Pattern:** Modular service-based architecture behind a single FastAPI gateway; each pipeline stage is an independent, testable module callable synchronously (hackathon) or via a task queue (stretch: Celery/Redis for async processing of large images).
- **Async Processing:** Long-running carving/reconstruction jobs run as background tasks with status polling/websocket updates to the frontend.

---

## 7. Database Collections

**`users`**
```
{ _id, name, email, password_hash, role, created_at }
```

**`cases`**
```
{ _id, user_id, title, source_type, status, created_at, updated_at }
```

**`artifacts`**
```
{
  _id, case_id, artifact_type, file_format,
  reconstructed_content_ref, related_fragment_ids: [],
  integrity_score, entropy_score, classification_tags: [],
  priority_score, recovered_timestamp, metadata: {}
}
```

**`fragments`**
```
{ _id, case_id, raw_offset, size, hash, cluster_id, embedding_ref }
```

**`chat_sessions`**
```
{ _id, case_id, user_id, messages: [{ role, content, cited_artifacts: [], timestamp }] }
```

**`reports`**
```
{ _id, case_id, summary_text, generated_at, export_url }
```

---

## 8. API Endpoints

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

**Cases**
- `POST /api/cases` — create new case
- `GET /api/cases` — list user's cases
- `GET /api/cases/{case_id}` — case details
- `DELETE /api/cases/{case_id}`

**Ingestion & Pipeline**
- `POST /api/cases/{case_id}/upload` — upload disk image / source
- `POST /api/cases/{case_id}/process` — trigger carving → reconstruction → scoring → classification pipeline
- `GET /api/cases/{case_id}/status` — pipeline progress (or websocket `/ws/cases/{case_id}/status`)

**Artifacts**
- `GET /api/cases/{case_id}/artifacts` — list recovered artifacts (filter by type, score, tag)
- `GET /api/artifacts/{artifact_id}` — full artifact detail
- `GET /api/artifacts/{artifact_id}/fragments` — related raw fragments

**Timeline**
- `GET /api/cases/{case_id}/timeline`

**Chat / RAG**
- `POST /api/cases/{case_id}/chat` — ask a question, returns answer + cited artifact IDs
- `GET /api/cases/{case_id}/chat/history`

**Reports**
- `POST /api/cases/{case_id}/report/generate`
- `GET /api/cases/{case_id}/report`
- `GET /api/cases/{case_id}/report/export` — PDF download

---

## 9. Folder Structure

```
forensic-recovery-copilot/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/            # config, security, jwt
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── cases.py
│   │   │   ├── artifacts.py
│   │   │   ├── chat.py
│   │   │   └── reports.py
│   │   ├── services/
│   │   │   ├── ingestion.py
│   │   │   ├── reconstruction.py
│   │   │   ├── integrity_scoring.py
│   │   │   ├── classification.py
│   │   │   ├── rag_engine.py
│   │   │   └── report_generator.py
│   │   ├── models/           # pydantic + db schemas
│   │   └── db/                # mongo client, vector store client
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── sample_data/               # test disk images for demo
├── docker-compose.yml
├── spec.md
└── README.md
```

---

## 10. Development Phases

**Phase 0 — Setup (Hours 0–2)**
- Repo scaffolding, Docker Compose, auth boilerplate, base schemas.

**Phase 1 — Ingestion & Carving (Hours 2–6)**
- Integrate PhotoRec/bulk_extractor subprocess call; parse raw fragment output into `fragments` collection.

**Phase 2 — Reconstruction & Scoring (Hours 6–14)**
- Embedding-based fragment clustering; entropy + format-validation integrity scoring.

**Phase 3 — Classification & Prioritization (Hours 14–20)**
- Artifact type tagging; priority scoring logic.

**Phase 4 — RAG Assistant & Timeline (Hours 20–28)**
- Vector store indexing of reconstructed content; chat endpoint with citation; timeline aggregation.

**Phase 5 — Frontend Integration (Hours 20–32, parallel)**
- Dashboard, case upload, results grid, artifact detail, chat UI.

**Phase 6 — Reporting & Polish (Hours 32–38)**
- Report generation, PDF export, UI polish, demo data prep.

**Phase 7 — Demo Prep (Hours 38–40)**
- Build a corrupted test image (dd + injected corruption), rehearse before/after walkthrough, prepare pitch.

---

## 11. UI and UX Requirements

- **Tone:** Clean, dark-themed "security tool" aesthetic (monospace accents, terminal-style highlights) matching the problem statement's own dark UI.
- **Clarity over decoration:** Every artifact must visibly show its confidence score (color-coded: green/yellow/red) at a glance.
- **Progressive disclosure:** Summary grid first → drill into artifact detail → drill into raw fragments.
- **Live feedback:** Processing pipeline shows real-time stage progress (carving → clustering → scoring → classifying), not a blank spinner.
- **Explainability:** Chat assistant answers must show which artifacts/fragments back each claim (clickable citations).
- **Accessibility:** Sufficient color contrast for score indicators (don't rely on color alone — add icons/labels).
- **Responsiveness:** Usable on laptop screens at minimum; no mobile requirement for hackathon scope.

---

## 12. Security Requirements

- All uploaded disk images/sources stored in isolated, access-controlled storage; never publicly accessible.
- JWT auth on all API routes except login/register; role checks enforced server-side.
- Passwords hashed with bcrypt; no plaintext storage anywhere.
- Input validation/sanitization on all uploads (file type/size limits) to prevent malicious payloads.
- Case data strictly scoped per user/team — no cross-case data leakage.
- LLM calls must not leak raw case data beyond what's needed for the query (scope RAG retrieval to the active case only).
- Audit log of case access and chat queries (who accessed what, when) — important for forensic chain-of-custody credibility.
- Rate limiting on auth and upload endpoints.
- HTTPS enforced in any deployed environment.

---

## 13. Final Expected Outcome

A working end-to-end demo where a corrupted/deleted test disk image is uploaded and, within minutes, the system:
1. Recovers raw fragments using standard carving tools.
2. Reconstructs and clusters related fragments into coherent artifacts.
3. Assigns each artifact a clear integrity/confidence score.
4. Classifies and prioritizes artifacts by type and sensitivity.
5. Lets an investigator ask natural-language questions about the case and get cited, evidence-backed answers.
6. Produces a downloadable, plain-English recovery report summarizing what was found and what wasn't.

**Success Criteria for Hackathon Judging:**
- Live before/after demo (raw corrupted data → structured, scored, explained evidence).
- Clear articulation that the system augments (not replaces) existing forensic tools.
- Functional confidence-scoring and RAG chat, since these are the core AI differentiators over traditional recovery software.
