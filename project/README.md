# Adaptive AI Agent for Secure AutoML with Blockchain-Based Dataset Integrity

Final-year B.Tech CSE project. See `docs/architecture-v1.md` for the full system
architecture, ER diagram, API spec, Level 1/2/3 behavior matrix, and roadmap.

**Status: Phase 1 complete.** Auth, dataset upload/hashing/profiling, and
integrity verification are real and tested end-to-end. AI Agent, AutoML/HPO,
experiment tracking, and real blockchain wiring are scaffolded but not yet
implemented (see phase markers below and in the code).

## Quick start (local, no Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp ../.env.example .env   # edit JWT_SECRET_KEY at minimum

# Applies the schema via Alembic (uses SQLite by default for local dev)
alembic upgrade head

uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

Run the test suite:
```bash
pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173
```

### Blockchain (Phase 8/9 — not yet wired to the backend)
```bash
cd blockchain
npm install
npx hardhat test          # contract tests
npx hardhat node          # local chain, in its own terminal
npm run deploy:local      # deploys DatasetRegistry, prints its address
```
Once deployed, put the printed address into `backend/.env` as
`DATASET_REGISTRY_CONTRACT_ADDRESS` — this wiring is Phase 8 work, currently
`app/blockchain/service.py` is a clearly marked MOCK.

## Quick start (Docker Compose)
```bash
cp .env.example .env   # edit JWT_SECRET_KEY at minimum
docker compose up --build
```
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Postgres: localhost:5432

## What's implemented vs. scaffolded

| Area | Status |
|---|---|
| Auth (register/login/JWT/expertise level) | **Implemented & tested** |
| Database schema (all 11 tables) + Alembic migration | **Implemented & tested** |
| Dataset upload, SHA-256 hashing, profiling | **Implemented & tested** |
| Dataset tamper verification | **Implemented & tested**, against a **mock** blockchain layer |
| Landing page, auth pages, onboarding, adaptive dashboard | **Implemented**, builds clean, typechecked |
| Datasets page (list + upload) | **Implemented**, wired to real API |
| Smart contract (`DatasetRegistry.sol`) | **Implemented & tested** (Hardhat), not yet called by backend |
| AI Agent workspace, AutoML/HPO engine, experiment tracking, real blockchain wiring, analytics | **Not started** — placeholders in the UI, phases 5–11 in the roadmap |

## Project structure
See `docs/architecture-v1.md` Section 7 for the annotated folder structure.

## Next steps (Phase 2 onward)
Per the development methodology in the original spec, each subsequent phase
should be approved before implementation. Suggested order matches the
roadmap: Phase 3 (settings/full auth polish) → Phase 5 (AI Agent) → Phase 6
(AutoML engine) → Phase 7 (experiment tracking) → Phase 8/9 (blockchain
wiring) → Phase 10 (adaptive UX polish) → Phase 11 (analytics).
