# Adaptive AI Agent for Secure & Intelligent AutoML with Blockchain-Based Dataset Integrity
## System Architecture — v1.0 (Pre-Implementation)

> Status: **Proposal for approval.** No code has been written yet, per your instructions in section 33. This document covers items 1–15. Section 16 (REUSE/MODIFY/REBUILD/NEW) is left as a template at the end — I need to see your existing AutoML implementation (repo, folder listing, or key files) before I can classify components; I did not want to guess and risk telling you to throw away working code.

---

## 1. Final System Architecture (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│   React + TS + Vite SPA — Landing, Auth, Dashboard, Agent UI     │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS / REST + WebSocket (agent stream)
┌───────────────────────────────▼───────────────────────────────────┐
│                     API GATEWAY (FastAPI)                        │
│   AuthN/AuthZ, rate limiting, request validation, routing        │
└───────────────────────────────┬───────────────────────────────────┘
                                 │
┌───────────────────────────────▼───────────────────────────────────┐
│                     AI AGENT ORCHESTRATOR                        │
│  Intent parsing → task routing → level-aware response shaping    │
└──┬─────────┬──────────┬───────────┬───────────┬─────────┬─────────┘
   │         │          │           │           │         │
┌──▼───┐ ┌───▼────┐ ┌───▼─────┐ ┌───▼──────┐ ┌──▼──────┐ ┌▼─────────┐
│Dataset│ │Preproc.│ │Model Sel│ │HPO Engine│ │Eval     │ │Knowledge │
│Profiler│ │Engine  │ │Engine   │ │(Optuna)  │ │Engine   │ │Memory    │
└──┬───┘ └───┬────┘ └───┬─────┘ └───┬──────┘ └──┬──────┘ └┬─────────┘
   └─────────┴──────────┴───────────┴───────────┴─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   PostgreSQL (metadata,  │
                    │   experiments, users,    │
                    │   knowledge memory)      │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────▼───────────────────────┐
        │              DATASET SECURITY LAYER             │
        │  hashing (SHA-256) → off-chain storage pointer  │
        └───────────┬──────────────────────┬──────────────┘
                     │                      │
        ┌────────────▼────────┐  ┌──────────▼────────────┐
        │  Off-chain storage   │  │  Blockchain Ledger     │
        │  (local disk / S3-   │  │  (Hardhat local chain  │
        │  compatible bucket)  │  │  + smart contract)     │
        └──────────────────────┘  └────────────────────────┘
```

**Key design decision:** the AutoML engine (Profiler → Preprocessing → Model Selection → HPO → Evaluation) is a **single shared pipeline**. The three expertise levels never fork the underlying computation — they only change (a) what's asked of the user up front, (b) what's shown back, and (c) which controls are exposed. This is what makes the "same engine, three experiences" claim in your objective 2 actually true and testable, rather than three separate hard-coded flows that happen to look different.

---

## 2. Component Architecture

| Component | Responsibility | Talks to |
|---|---|---|
| **Agent Orchestrator** | Parses user intent (NL or UI action), maintains conversation state, decides which engine(s) to invoke, formats response per expertise level | All engines, Knowledge Memory, DB |
| **Dataset Profiler** | Row/col counts, dtypes, missing values, cardinality, class balance, candidate target detection | Off-chain storage, DB |
| **Preprocessing Engine** | Imputation, encoding, scaling, imbalance handling — chooses defaults, exposes overrides at L2/L3 | Profiler output |
| **Model Selection Engine** | Rule-based + heuristic shortlist of candidate models based on task type, data size, feature types | Profiler output |
| **AutoML Engine** | Orchestrates train/test split → fit candidates → collect metrics | Preprocessing, Model Selection |
| **HPO Engine** | Optuna study per candidate model, bounded by level-appropriate search space/budget | AutoML Engine |
| **Evaluation Engine** | Computes metrics, confusion matrix, ROC/PR, feature importance | AutoML/HPO output |
| **Knowledge Memory** | Structured store of past datasets, models, decisions, user prefs — retrieved (not free-form) by the orchestrator | DB |
| **Dataset Security Layer** | Hashing, versioning, ties dataset record to blockchain transaction | Off-chain storage, Blockchain Ledger |
| **Blockchain Ledger** | Smart contract registering dataset hash/version/timestamp; verification calls | Backend blockchain service (web3 client) |

---

## 3. Database ER Design

```
User
 ├─ id (PK)
 ├─ email, password_hash
 ├─ expertise_level (enum: BEGINNER | INTERMEDIATE | EXPERT)
 ├─ created_at, updated_at

Dataset
 ├─ id (PK)
 ├─ owner_id (FK → User)
 ├─ name
 ├─ storage_path            -- off-chain pointer
 ├─ current_version_id (FK → DatasetVersion)
 ├─ target_column (nullable, set after profiling)
 ├─ task_type (CLASSIFICATION | REGRESSION | UNSET)
 ├─ created_at

DatasetVersion
 ├─ id (PK)
 ├─ dataset_id (FK → Dataset)
 ├─ version_number
 ├─ sha256_hash
 ├─ row_count, column_count
 ├─ storage_path
 ├─ blockchain_record_id (FK → BlockchainRecord, nullable until confirmed)
 ├─ created_at

DatasetMetadata
 ├─ id (PK)
 ├─ dataset_version_id (FK → DatasetVersion)
 ├─ profiling_json          -- dtypes, missing %, cardinality, class balance
 ├─ generated_at

BlockchainRecord
 ├─ id (PK)
 ├─ dataset_version_id (FK → DatasetVersion)
 ├─ tx_hash
 ├─ block_number
 ├─ action (DATASET_REGISTERED | DATASET_VERIFIED | DATASET_REVOKED)
 ├─ chain_status (PENDING | CONFIRMED | FAILED)
 ├─ timestamp

Experiment
 ├─ id (PK)
 ├─ user_id (FK → User)
 ├─ dataset_version_id (FK → DatasetVersion)
 ├─ task_type
 ├─ target_column
 ├─ status (RUNNING | COMPLETED | FAILED)
 ├─ best_model_result_id (FK → ModelResult, nullable)
 ├─ random_seed
 ├─ started_at, completed_at

ExperimentIteration
 ├─ id (PK)
 ├─ experiment_id (FK → Experiment)
 ├─ step_name (PROFILING | PREPROCESSING | MODEL_SELECTION | TRAINING | HPO | EVALUATION)
 ├─ status (WAITING | RUNNING | COMPLETED | WARNING | FAILED)
 ├─ started_at, duration_ms
 ├─ log_json

ModelResult
 ├─ id (PK)
 ├─ experiment_id (FK → Experiment)
 ├─ model_name
 ├─ hyperparameters_json
 ├─ metrics_json           -- accuracy/precision/recall/f1/roc_auc OR mae/mse/rmse/r2
 ├─ training_time_ms
 ├─ feature_importance_json (nullable)
 ├─ confusion_matrix_json (nullable)

OptunaTrial
 ├─ id (PK)
 ├─ model_result_id (FK → ModelResult)
 ├─ trial_number
 ├─ params_json
 ├─ metric_value
 ├─ duration_ms
 ├─ status (COMPLETE | PRUNED | FAILED)

KnowledgeMemory
 ├─ id (PK)
 ├─ user_id (FK → User)
 ├─ dataset_id (FK → Dataset, nullable)
 ├─ memory_type (RECOMMENDATION | PREFERENCE | PAST_DECISION)
 ├─ payload_json
 ├─ created_at

AgentConversation
 ├─ id (PK)
 ├─ user_id (FK → User)
 ├─ session_id
 ├─ role (USER | AGENT)
 ├─ message
 ├─ related_experiment_id (FK → Experiment, nullable)
 ├─ created_at
```

Indexes: `dataset_id` on `DatasetVersion`, `experiment_id` on `ModelResult`/`ExperimentIteration`, `user_id` on `AgentConversation`/`KnowledgeMemory`, unique `(dataset_id, version_number)`.

---

## 4. Blockchain Architecture

**Choice: Ethereum-compatible local network (Hardhat) over Hyperledger Fabric.**
Reasoning: your dataset-integrity use case is single-writer-registers/many-verify, doesn't need Fabric's permissioned-channel complexity, and Hardhat gives you a fast local chain, easy viva demo (block explorer visible), and simpler smart-contract tooling for a B.Tech timeline. Fabric is defensible if you want to argue for a permissioned consortium model in your report, but it adds real setup cost for no functional gain here — flag if you disagree and want to justify Fabric for the paper.

**Smart contract (`DatasetRegistry.sol`) — conceptual interface:**
```solidity
function registerDataset(string datasetId, bytes32 hash, uint256 version) → txHash
function verifyDataset(string datasetId, bytes32 currentHash) → (bool matches, uint256 registeredVersion)
function getDatasetHistory(string datasetId) → RegistrationRecord[]
```
Only hash + ID + version + timestamp go on-chain, per your privacy requirement (Section 25). The backend's Blockchain Ledger service is a thin web3 client wrapping these three calls; `BlockchainRecord` in Postgres mirrors on-chain state for fast UI queries, with chain as source of truth on any conflict (re-verified on demand via `verifyDataset`).

**Flow:**
1. Dataset uploaded → SHA-256 computed → `registerDataset` called → tx pending
2. Backend polls/listens for confirmation → updates `BlockchainRecord.chain_status`
3. "Verify Dataset" action → recompute hash of stored file → call `verifyDataset` → compare

---

## 5. AI Agent Architecture

```
User message / UI action
        │
        ▼
┌───────────────────┐
│ Intent Classifier  │  (rule-based + LLM-assisted: "analyze", "build model",
│                    │   "explain", "compare", "verify", etc.)
└─────────┬──────────┘
          ▼
┌───────────────────┐     ┌────────────────────┐
│ Context Builder    │────▶│ Knowledge Memory    │  (retrieves relevant past
│ (dataset state,    │     │ (structured lookup, │   decisions — NOT free-text
│  experiment state) │     │  no uncontrolled     │   recall)
└─────────┬──────────┘     │  long-term memory)   │
          ▼                └────────────────────┘
┌───────────────────┐
│ Task Router         │──▶ dispatches to Profiler / AutoML / HPO / Eval /
│                     │    Blockchain service as needed
└─────────┬──────────┘
          ▼
┌───────────────────┐
│ Response Shaper     │  applies expertise-level template:
│ (Level 1/2/3)       │  simplifies OR annotates OR exposes raw diagnostics
└─────────┬──────────┘
          ▼
   Streamed response (WebSocket) + structured workflow-state update
```

The LLM's role is scoped deliberately: it drives intent understanding and natural-language explanation generation, but it does **not** decide model hyperparameters or training logic directly — those come from the deterministic engines. This keeps the AutoML results reproducible and defensible in a viva ("why did it pick Random Forest?" has a rule-based answer, not "the LLM felt like it").

---

## 6. Level 1 / 2 / 3 Behavior Matrix

| Dimension | Level 1 (Guided) | Level 2 (Assisted) | Level 3 (Expert) |
|---|---|---|---|
| Entry point | "Tell me what you want to predict" + 3 big buttons | Dataset stats + recommendations shown upfront | Full pipeline config panel |
| Target selection | Agent infers from NL request | Agent suggests, user confirms | User sets manually + can override task type |
| Preprocessing | Fully automatic, not shown | Shown with plain-language rationale, editable defaults | Full manual control (imputation strategy, encoders, scalers) |
| Model candidates | Hidden — agent just trains "the best options" | Shown as a shortlist with 1-line reasoning each | Full candidate list + ability to add/remove models |
| Hyperparameters | Hidden entirely | Key params only (e.g., n_estimators, max_depth) with sane ranges | Full Optuna search space editor |
| HPO budget/trials | Small, fixed, invisible | Visible trial count, adjustable within a bounded range | Fully configurable (trials, timeout, pruner, sampler) |
| Results shown | Best model + plain-language explanation + 1 chart | Metrics table, model comparison chart, confusion matrix | All of Level 2 + ROC/PR curves, feature importance, HPO history, logs |
| Explanations | "This model correctly predicted churn 89% of the time" | "Random Forest scored 0.89 F1, beating Logistic Regression (0.81) mainly due to non-linear feature interactions" | Full technical breakdown + statistical caveats |
| Errors | Plain message + suggested next step | Plain message + option to view details | Full stack trace / log access |
| Blockchain visibility | Simple ✓ Verified badge | Verified badge + hash + last-verified time | Full ledger view, tx details, manual re-verify |

Switching levels **never re-runs the pipeline** — it re-renders the same experiment/result data through a different template. This is the actual research contribution to demonstrate.

---

## 7. Complete Folder Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/       # buttons, cards, charts, workflow nodes
│   │   ├── pages/             # Landing, Dashboard, Agent, Datasets, Experiments,
│   │   │                      # Models, Blockchain, Analytics, Settings
│   │   ├── layouts/           # AppShell (sidebar+topbar), AuthLayout
│   │   ├── hooks/              # useAgentSocket, useExpertiseLevel, useDataset
│   │   ├── services/           # api client, ws client
│   │   ├── stores/              # zustand: auth, expertiseLevel, activeExperiment
│   │   ├── types/                # shared TS types (mirrors backend Pydantic)
│   │   └── animations/           # framer-motion variants
│   └── ...
├── backend/
│   ├── app/
│   │   ├── api/                # routers: auth, datasets, agent, experiments, models, blockchain
│   │   ├── agents/              # orchestrator, intent classifier, response shaper
│   │   ├── automl/               # profiler, preprocessing, model_selection, hpo, evaluation
│   │   ├── datasets/               # upload handling, storage, versioning
│   │   ├── blockchain/               # web3 client, contract ABI, service layer
│   │   ├── experiments/                # experiment CRUD, comparison logic
│   │   ├── models/                      # SQLAlchemy models
│   │   ├── knowledge/                     # structured memory read/write
│   │   ├── database/                       # session, migrations (alembic)
│   │   └── core/                            # config, security, logging, deps
│   ├── tests/
│   └── ...
├── blockchain/
│   ├── contracts/DatasetRegistry.sol
│   ├── scripts/deploy.ts
│   └── tests/DatasetRegistry.test.ts
├── docs/
├── docker/
├── docker-compose.yml
└── README.md
```

---

## 8. API Specification (summary)

Full CRUD conventions apply (pagination on list endpoints, standard error envelope `{error, message, details}`, JWT bearer auth on all except `/auth/*`).

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/users/me
PATCH  /api/v1/users/me/expertise-level

POST   /api/v1/datasets/upload
GET    /api/v1/datasets
GET    /api/v1/datasets/{id}
GET    /api/v1/datasets/{id}/profile
POST   /api/v1/datasets/{id}/verify

POST   /api/v1/agent/chat            (WebSocket for streaming)
POST   /api/v1/agent/analyze

POST   /api/v1/experiments
GET    /api/v1/experiments
GET    /api/v1/experiments/{id}
GET    /api/v1/experiments/{id}/iterations
POST   /api/v1/experiments/compare   (body: [experiment_ids])

POST   /api/v1/models/train          (internal — usually triggered via experiment)
GET    /api/v1/models/{id}
GET    /api/v1/models/{id}/hpo-trials

GET    /api/v1/blockchain/ledger
GET    /api/v1/blockchain/transactions/{id}
```

---

## 9. Frontend Page Map

```
/                          Landing page
/login, /signup            Auth
/onboarding                Expertise level selection
/dashboard                 Level-adaptive home
/agent                     AI Agent workspace (3-pane layout)
/datasets                  List + upload
/datasets/:id              Detail: profile, integrity, versions
/experiments                List + filters
/experiments/:id             Results, comparison, HPO history
/models/:id                    Model detail (metrics, confusion matrix, feature importance)
/blockchain                       Ledger timeline + block visualization
/analytics                          Cross-experiment analytics
/settings                             Profile, expertise level change, security
```

---

## 10. UI/UX Design System (starting points)

- **Type scale**: one display face for hero/headings, one workhorse sans for body/UI (e.g., a geometric sans like Inter/Söhne-alike for UI, a slightly warmer serif or distinct display weight for the landing hero — avoid defaulting to Inter everywhere, it reads as generic).
- **Color**: neutral dark/light base (near-black / near-white, not pure), one accent hue used sparingly for primary actions and status (verified/success), a second muted hue for "in progress" states. Avoid gradient-as-decoration; use it only in the hero visualization and level badges.
- **Elevation**: flat cards by default; glass/blur reserved for the hero visualization overlay and modals only — not the whole dashboard.
- **Workflow node states**: color + icon + subtle pulse animation for "Running", static check for "Completed", outline for "Waiting" — never rely on color alone (accessibility).
- **Density**: Level 1 screens get generous spacing and large touch targets; Level 3 screens are allowed denser tables/panels since expert users value information density over breathing room. This density shift is itself part of the adaptive-UX story worth mentioning in your report.

I'll do full component-level design tokens (spacing scale, exact palette, shadows) in Phase 2 using the frontend-design conventions available in this environment, so the landing page and dashboard don't come out looking like a generic admin template.

---

## 11. Development Roadmap

Following your 15-phase plan as-is (Section 28) — no changes proposed. I'd only flag: Phase 8 (blockchain registration) and Phase 9 (verification) are tightly coupled and could be merged into one phase in practice, since you can't meaningfully test registration without a verify path. I'll keep them separate as you specified unless you'd rather combine.

---

## 12. Testing Strategy

| Layer | Approach |
|---|---|
| Backend unit | pytest — profiler, preprocessing, model selection logic in isolation with synthetic dataframes |
| AutoML/HPO | Fixed-seed runs on small canned datasets (e.g., a shrunk Titanic/Iris-style CSV) asserting metrics land in an expected range, not exact values |
| API | pytest + httpx against a test DB (sqlite or throwaway postgres schema) for every endpoint in Section 8 |
| Blockchain | Hardhat test suite (mocha/chai) for contract logic; backend integration test against local Hardhat node |
| Frontend | Vitest + React Testing Library for components; Playwright for the demo-critical flow (Section 31 end to end) |
| Adaptive UX | Snapshot-style tests asserting Level 1/2/3 render different field sets from the *same* experiment payload — this is the test that actually proves your research claim |

---

## 13. Security Strategy

- JWT access + refresh tokens, short-lived access token, httpOnly refresh cookie
- Password hashing via bcrypt/argon2
- File upload: extension + MIME allowlist (csv, xlsx), size cap, virus-scan hook point (even if stubbed for the demo), stored outside the web root
- Per-user dataset access control enforced at the query layer, not just the UI
- Rate limiting on `/auth/*` and `/agent/chat`
- All secrets (DB creds, JWT secret, chain RPC URL, private keys for the contract deployer) via environment variables, never committed; `.env.example` checked in instead
- Audit log table for dataset access and blockchain actions (can reuse `AgentConversation`-style append-only pattern)

---

## 14. Research Contribution (how to frame it in your report)

1. **User-adaptive AI interaction** — demonstrated via the Level 1/2/3 matrix (Section 6) driven off one shared pipeline, not three separate apps.
2. **AutoML automation** — model selection heuristic + Optuna HPO with reproducible seeds.
3. **Dataset integrity verification** — SHA-256 + on-chain hash registration, tamper detection demo (edit a CSV byte, re-verify, show mismatch).
4. **Blockchain traceability** — full ledger view with transaction history per dataset version.
5. **Experiment reproducibility** — every `Experiment` row captures seed + hyperparameters + dataset version, enough to literally re-run it.
6. **Secure dataset handling** — off-chain storage + access control + hash-only on-chain data (explicitly argue the privacy trade-off in your report; it's a real design decision worth defending).

---

## 15. Final Demo Workflow

Matches your Section 31 exactly — no changes proposed. I'd suggest scripting it as a Playwright test as noted in Section 12, so the same flow used for evaluation can be replayed reliably in the viva if a live demo hiccups.

---

## 16. Component Reuse Classification (REUSE / MODIFY / REBUILD / NEW)

I can't fill this in responsibly without seeing what you already have. Could you share:
- your existing AutoML implementation's folder structure or repo, and
- roughly what it currently does (e.g., "just a sklearn pipeline script," "has a FastAPI backend already," "no UI yet")?

Once I see that, I'll go component-by-component against the list in Section 2 and mark each REUSE / MODIFY / REBUILD / NEW with reasoning — I won't recommend rebuilding anything that already works.

---

### What I need from you before Phase 1 starts
1. Confirm or adjust the Hardhat-over-Fabric decision (Section 4).
2. Share your existing AutoML code so Section 16 can be completed.
3. Confirm the roadmap in Section 11 as-is, or tell me to merge phases 8/9.

Once confirmed, I'll start Phase 1 (architecture + DB schema + project scaffolding) exactly as scoped.
