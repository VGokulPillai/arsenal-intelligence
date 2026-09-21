# Arsenal FC Football Intelligence Platform

An executive-grade, AI-powered control center for Arsenal Football Club, built on **Databricks Apps** with a React frontend and Python/FastAPI backend. Features live weather (Open-Meteo), live football data (API-Football), Databricks Lakebase for operational fan data, ML models, and animated dashboards. The platform unifies sporting performance intelligence and commercial decision-making in one unified application.

![Databricks](https://img.shields.io/badge/Built%20on-Databricks-FF3621?style=for-the-badge&logo=databricks&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Lakebase](https://img.shields.io/badge/Data-Lakebase%20(PostgreSQL)-336791?style=for-the-badge&logo=postgresql&logoColor=white)

---

## Features

### ML & RAG (Machine Learning + Retrieval-Augmented Generation)

- **RAG-augmented Copilot**: Ask Genie uses live API-Football data (squad, fixtures, standings, injuries, transfers, predictions) as context for accurate, data-grounded answers
- **Attendance prediction**: ML model predicts matchday attendance from opponent tier, weather, competition
- **Injury risk model**: Predicts player injury risk from training load, fatigue, matches/minutes
- **Match prediction**: API-Football predictions + ML match outcome model
- **Fan Ops AI**: Genie queries Lakebase in real-time for fan group operations data

### Core Capabilities

1. **Executive Dashboard**
   - Single pane of glass for leadership
   - Real-time alerts and key insights
   - Upcoming fixtures overview with live match countdown

2. **Live Football Data (API-Football)**
   - Premier League standings (live)
   - Fixtures, results, and form
   - Full squad with photos, stats, and positions
   - Injuries and suspensions
   - Top scorers and assists

3. **Audience Prediction & Matchday Demand**
   - Attendance forecasts for upcoming matches
   - Demand heatmaps by stadium zone
   - Fan segmentation (geography, loyalty, spending)
   - Live weather integration (Open-Meteo)
   - Booking velocity and forecast confidence bands

4. **Revenue Optimization**
   - Projected revenue by fixture
   - ML-driven pricing strategies
   - Marketing recommendations (targeted promotions, upsell)
   - What-if pricing simulation

5. **Player Performance**
   - Match metrics (goals, assists, xG, xA, pass %, distance, sprints)
   - Form progression and position-specific KPIs
   - Player comparison and radar charts
   - Player photos from API-Football

6. **Health & Squad Readiness**
   - Injury status and fatigue monitoring
   - Training load vs fatigue analysis
   - ML injury risk model
   - Medical risk flags

7. **Transfer Intelligence**
   - Transfer target scores (sporting, commercial, tactical)
   - Squad gap analysis with ML fit scores
   - Real transfer data from API-Football
   - AI-generated recommendations

8. **Media & Popularity Intelligence**
   - GPT-powered news analysis (injuries, transfers in/out)
   - Sentiment scores and popularity momentum
   - Trending players and news summary
   - Transfer news, match reports, and general news feeds

9. **Live Match Planning (Tactical Board)**
   - Vertical pitch with XI vs opponent, 90-minute clock
   - Drag-and-drop substitutions and reshuffles
   - ML tactical recommendations
   - Dynamic fatigue simulation

10. **Fan Group Matchday Operations (Lakebase)**
    - Fan group dashboard with KPIs (allocated, confirmed, pending, cancelled, checked-in)
    - Fan group detail pages with ticket allocations
    - Individual fan/ticket lists with seat assignments
    - Operational updates (ticket status, check-in, gate changes, notes)
    - Open issues tracking with resolution workflow
    - Genie AI assistant queries Lakebase in real-time

11. **AI Copilot (Genie)**
    - Natural language queries about players, fixtures, transfers, revenue
    - Fan group operations queries powered by Lakebase
    - Explicit data source attribution (shows when data comes from Lakebase)
    - Context-aware responses with live data

12. **Architecture Visualization**
    - Animated data flow diagram
    - Live Lakebase connection status
    - Schema explorer

---

## Architecture

```
arsenal/
├── app.py                 # FastAPI entry point
├── app.yaml               # Databricks App config
├── databricks.yml         # Asset Bundle definition
├── requirements.txt       # Python dependencies
├── server/
│   ├── config.py          # Dual-mode auth (Databricks vs local)
│   ├── data/
│   │   ├── fan_ops_db.py  # Lakebase/SQLite dual-mode database layer
│   │   ├── fan_ops_seed.py # Sample data generator
│   │   └── mock_data.py   # Demo data (used when Delta tables not available)
│   ├── services/
│   │   └── fixtures.py    # Fixture computation logic
│   └── routes/            # API endpoints
│       ├── audience.py    # Attendance & demand
│       ├── copilot.py     # AI Genie (queries Lakebase for fan ops)
│       ├── executive.py   # Dashboard KPIs
│       ├── fan_ops.py     # Fan group CRUD operations
│       ├── football.py    # API-Football live data
│       ├── media.py       # News & sentiment
│       ├── ml.py          # ML model endpoints
│       ├── players.py     # Player stats
│       ├── revenue.py     # Revenue optimization
│       ├── simulation.py  # Tactical simulation
│       ├── transfers.py   # Transfer market
│       ├── vision.py      # Video/scouting
│       └── weather.py     # Open-Meteo weather
├── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/         # 12+ dashboard pages
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Genie, Notifications)
│   │   └── lib/           # API client, utilities
│   ├── public/images/     # Arsenal branding assets
│   └── package.json
├── resources/             # Databricks Asset Bundle resources
│   ├── arsenal.app.yml    # App + serving endpoint resource
│   └── arsenal.lakebase.yml # Lakebase project, branches, endpoints, roles
├── scripts/
│   └── lakebase/          # Lakebase automation scripts
│       ├── reset-development.sh
│       ├── create-feature-branch.sh
│       ├── delete-feature-branch.sh
│       ├── apply-permissions.sh
│       └── validate-permissions.sh
└── db/
    ├── migrations/        # Schema change migrations (version-controlled)
    │   ├── V001__create_coaching_schema.sql
    │   └── V002__create_scouting_schema.sql
    └── permissions/       # Branch-specific RBAC SQL
        ├── apply_prod_permissions.sql
        ├── apply_dev_permissions.sql
        └── apply_uat_permissions.sql
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  React SPA (Vite)                                            │
│  12+ routed pages + Genie slide-out panel                   │
└───────────────────────┬──────────────────────────────────────┘
                        │ /api/* 
┌───────────────────────▼──────────────────────────────────────┐
│  FastAPI (app.py, port 8000)                                 │
│  Route modules under server/routes/                          │
└──┬────────────┬────────────┬─────────────┬───────────────────┘
   │            │            │             │
API-Football  Open-Meteo  Databricks   Databricks Lakebase
(live data)   (weather)   FM/Genie     (Fan Ops PostgreSQL)
                          (Copilot)    (ticket ops, issues)
```

### Lakebase Architecture (Fan Group Operations)

```
Ticketing Source (CSV/API/CRM)
        │
        ▼
[Databricks Bronze] raw ticket events
        │
        ▼
[Databricks Silver] cleaned fan groups, fans, fixtures, allocations
        │
        ▼
[Databricks Gold] operational views
        │
        ▼
[Lakebase (PostgreSQL)] operational serving tables
        │
        ▼
[Databricks App] ←→ Frontend + Backend + Genie AI
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons |
| Backend | FastAPI, Pydantic, Python 3.10+ |
| AI/ML | Databricks Foundation Models (Claude), OpenAI GPT (news analysis) |
| Database | Databricks Lakebase (PostgreSQL) with SQLite fallback |
| Data | Delta Lake, Unity Catalog |
| Deployment | Databricks Apps, Databricks Asset Bundles |
| Auth | Databricks SDK OAuth token rotation (for Lakebase) |

---

## Getting Started

### Prerequisites

- Databricks CLI (v1.0.0+ required for Lakebase DAB resources)
- Node.js 18+
- Python 3.10+
- Access to a Databricks workspace with:
  - Foundation Model endpoint (e.g., `databricks-claude-sonnet-4-5`)
  - Lakebase instance (for fan ops — optional, falls back to SQLite)
  - SQL warehouse (optional, for Delta table queries)

### 1. Clone the Repository

```bash
git clone https://github.com/VGokulPillai/arsenal-intelligence.git
cd arsenal-intelligence
```

### 2. Local Development

**Backend:**

```bash
pip install -r requirements.txt
export DATABRICKS_PROFILE=your-profile
uvicorn app:app --reload --port 8000
```

**Frontend (separate terminal):**

```bash
cd frontend
npm install
npm run dev   # Starts on http://localhost:5173, proxies /api to backend
```

Open http://localhost:5173

### 3. Deploy to Databricks Apps

#### Option A: Asset Bundles (Recommended)

1. **Configure your workspace** — Edit `databricks.yml` targets:

```yaml
targets:
  dev:
    workspace:
      host: https://YOUR-WORKSPACE.cloud.databricks.com
      profile: your-profile
```

2. **Build and deploy:**

```bash
cd frontend && npm run build && cd ..
databricks bundle deploy -t dev
```

#### Option B: Manual Deploy

1. **Create the app:**

```bash
databricks apps create arsenal-intelligence \
  --description "Arsenal FC Football Intelligence Platform" \
  -p your-profile
```

2. **Build the frontend:**

```bash
cd frontend && npm run build && cd ..
```

3. **Upload to workspace:**

```bash
WORKSPACE_PATH="/Workspace/Users/your-email/apps/arsenal-intelligence"

databricks workspace import-dir . "$WORKSPACE_PATH" \
  --exclude node_modules --exclude .venv --exclude __pycache__ \
  --exclude .git --exclude frontend/node_modules \
  -p your-profile --overwrite
```

4. **Deploy:**

```bash
databricks apps deploy arsenal-intelligence \
  --source-code-path "$WORKSPACE_PATH" \
  -p your-profile
```

---

## Lakebase Setup (Fan Group Operations)

The fan operations module uses **Databricks Lakebase** (PostgreSQL-compatible) for real-time operational data. If Lakebase is not configured, the app automatically falls back to in-memory SQLite with sample data.

### Connecting to Lakebase

1. **Create a Lakebase instance** in your Databricks workspace (Compute > Lakebase)

2. **Attach Lakebase to the app** via REST API:

```bash
curl -X PATCH \
  "https://YOUR-WORKSPACE.cloud.databricks.com/api/2.0/apps/arsenal-intelligence" \
  -H "Authorization: Bearer $(databricks auth token -p your-profile)" \
  -H "Content-Type: application/json" \
  -d '{
    "resources": [{
      "name": "lakebase",
      "lakebase": {
        "instance_name": "your-lakebase-instance",
        "database_name": "your-database",
        "permission": "READ_WRITE"
      }
    }]
  }'
```

3. **Redeploy** the app — the platform auto-detects `PGHOST` and connects using OAuth tokens:

```bash
databricks apps deploy arsenal-intelligence \
  --source-code-path "$WORKSPACE_PATH" -p your-profile
```

### How Authentication Works

The app uses **Databricks SDK OAuth token rotation** for Lakebase — no static passwords needed:

```python
from databricks.sdk import WorkspaceClient
w = WorkspaceClient()
cred = w.postgres.generate_database_credential()
password = cred.password  # Short-lived OAuth token
```

### Database Schema

The fan ops module creates an `arsenal_fan_ops` schema with these tables:

| Table | Purpose |
|-------|---------|
| `fan_ops_groups` | Fan group registry (name, region, type, contacts) |
| `fan_ops_fixtures` | Match schedule |
| `fan_ops_fans` | Individual fan records linked to groups |
| `fan_ops_ticket_allocations` | Ticket assignments per fan per fixture |
| `fan_ops_checkin_events` | Real-time check-in events |
| `fan_ops_group_issues` | Operational issues and resolutions |
| `fan_ops_operational_notes` | Staff notes and updates |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERVING_ENDPOINT` | Foundation Model endpoint (e.g., `databricks-claude-sonnet-4-5`) | Recommended |
| `CATALOG` | Unity Catalog catalog name | Optional |
| `SCHEMA` | Unity Catalog schema name | Optional |
| `API_FOOTBALL_KEY` | API-Football key for live data | Recommended |
| `DATABRICKS_WAREHOUSE_ID` | SQL warehouse for Delta queries | Optional |
| `GPT_FALLBACK_ENDPOINT` | Databricks external model endpoint for GPT | Optional |
| `PGHOST` | Lakebase hostname (auto-injected by Databricks Apps) | Auto |
| `PGDATABASE` | Lakebase database name (auto-injected) | Auto |
| `PGPORT` | Lakebase port (auto-injected) | Auto |

---

## API-Football Setup

The platform uses [API-Football](https://www.api-football.com/) for live data:

1. Sign up at https://www.api-football.com/ (free tier: 100 requests/day)
2. Get your API key
3. Set it in `app.yaml`:

```yaml
env:
  - name: API_FOOTBALL_KEY
    value: "your-api-key"
```

**Arsenal Team ID:** 42 | **Premier League ID:** 39

---

## Genie AI Assistant

The Genie copilot supports two categories of queries:

### Football Intelligence (Mock/API data)
- "Tell me about Saka"
- "What's the next fixture?"
- "Transfer targets"
- "Revenue projections"

### Fan Group Operations (Live from Lakebase)
- "What fan groups are there?" 
- "Which groups have pending tickets?"
- "International group attendance"
- "Accessibility requests"
- "Cancellation rates"
- "Who hasn't checked in?"
- "Matchday support issues"

When answering fan ops queries, Genie explicitly indicates the data source:
> *Data source: Databricks Lakebase (PostgreSQL)*

---

## Customization

### Branding

| Element | Value |
|---------|-------|
| Primary Red | `#EF0107` |
| Navy | `#063672` |
| Gold | `#9C824A` |
| Display Font | Bebas Neue |
| Body Font | Inter |
| Data Font | Share Tech Mono |

### Arsenal-Specific Config

| Setting | Value |
|---------|-------|
| Team ID (API-Football) | 42 |
| League | Premier League (ID: 39) |
| Stadium | Emirates Stadium (60,704 capacity) |
| Weather Location | London (51.5549, -0.1084) |

---

## Demo Flow

1. **Executive Dashboard** — Show overall KPIs, next match countdown, alerts
2. **Football Data** — Live standings, fixtures, squad photos from API-Football
3. **Player Performance** — Deep dive into player stats with radar charts
4. **Audience & Demand** — Predict attendance with ML, show weather impact
5. **Revenue Optimization** — Dynamic pricing simulator, fixture revenue projections
6. **Health Monitoring** — Squad fitness, injury risk model, fatigue tracking
7. **Transfer Intelligence** — AI-scored targets, gap analysis, market values
8. **Live Match Planning** — Drag-and-drop tactical board with ML recommendations
9. **Fan Group Ops** — Show Lakebase-powered dashboard, drill into groups, update tickets
10. **Genie AI** — Ask natural language questions, demonstrate Lakebase queries
11. **Architecture** — Show animated data flow, live Lakebase connection status

---

## Business Value

The platform demonstrates how **Databricks** powers end-to-end club intelligence:

| Domain | Capabilities |
|--------|-------------|
| **Sporting** | Player performance, injury risk, transfer decisions, squad depth, tactical planning |
| **Commercial** | Ticket revenue, fan targeting, pricing optimization, campaign ROI |
| **Operations** | Fan group management, matchday logistics, issue resolution (Lakebase) |
| **AI/ML** | Foundation Models, attendance prediction, injury risk, transfer scoring |
| **Unified** | One platform for directors, analysts, medical, marketing, ticketing |

---

## License

Internal demo. Arsenal FC branding for illustrative purposes only.

---

## Lakebase Branching & Environment Strategy

This repository manages Lakebase infrastructure as code using **Databricks Asset Bundles (DABs)**. The Lakebase project uses the **Autoscaling** model (`postgres_projects`), not the legacy Provisioned model.

### Prerequisites

- **Databricks CLI v1.0.0+** — Required for `postgres_roles`, `postgres_databases`, and all Lakebase resources. Check with `databricks --version`.
- **CAN_MANAGE** permission on the Lakebase project.
- OAuth U2M authentication configured (`databricks auth login`).

### Branch Topology

```
production (protected)          ← Live application data
├── uat                         ← Business validation before production
└── development                 ← Active development & testing
    ├── feature-james-xyz       ← Ephemeral feature branch
    └── feature-other-change    ← Ephemeral feature branch
```

| Branch | Purpose | Persistence | Parent | Protected |
|--------|---------|-------------|--------|-----------|
| `production` | Live application data, serving the deployed app | Permanent | — | Yes |
| `uat` | Business acceptance testing before production promotion | Permanent | production | No |
| `development` | Day-to-day development, periodically reset from production | Permanent | production | No |
| `feature-*` | Isolated work for individual features/developers | Temporary | development | No |

### Permission Matrix (RBAC)

Lakebase Postgres role state and GRANTs are **branch-local**. Each branch has its own permission model.

| Branch | Role | `arsenal_fan_ops` | `coaching` | `scouting` | Admin Privs |
|--------|------|-------------------|-----------|-----------|-------------|
| **production** | App Service Principal | READ + WRITE | READ + WRITE | READ + WRITE | None |
| **production** | Human Developers | READ only | READ only | READ only | None |
| **development** | App Service Principal | READ + WRITE | READ + WRITE | READ + WRITE | None |
| **development** | Developer Group | READ + WRITE | READ + WRITE | READ + WRITE | None |
| **uat** | App Service Principal | READ + WRITE | READ + WRITE | READ + WRITE | None |
| **uat** | UAT Tester Group | READ + WRITE | READ + WRITE | READ + WRITE | None |

**Principle of least privilege:**
- No developer gets `DATABRICKS_SUPERUSER`, `BYPASSRLS`, or `CREATEROLE`
- Project-level `CAN_USE`/`CAN_MANAGE` are NOT used as substitutes for schema-level Postgres privileges
- Unity Catalog synced tables remain read-only to all application users

### Repository Structure

```
resources/
  arsenal.app.yml           # Databricks App + Lakebase binding
  arsenal.lakebase.yml      # Lakebase project, branches, endpoints, roles, databases

scripts/
  lakebase/
    reset-development.sh    # Reset dev from production + reapply permissions
    create-feature-branch.sh # Create isolated feature branch from development
    delete-feature-branch.sh # Safely delete a feature branch
    apply-permissions.sh    # Apply permission SQL to a specific branch
    validate-permissions.sh # Validate RBAC across all branches

db/
  migrations/
    V001__create_coaching_schema.sql
    V002__create_scouting_schema.sql
  permissions/
    apply_prod_permissions.sql
    apply_dev_permissions.sql
    apply_uat_permissions.sql
```

### Deployment

#### Validate and Deploy

```bash
# Validate configuration
databricks bundle validate -t dev

# Deploy to development
databricks bundle deploy -t dev

# Deploy to production
databricks bundle validate -t prod
databricks bundle deploy -t prod
```

#### What Gets Deployed

The bundle creates/adopts:
- Lakebase project (adopted from existing `arsenal-lakebase`)
- Protected production branch with 4-8 CU endpoint
- Development branch with 0.5-2 CU endpoint (scale-to-zero)
- UAT branch with 0.5-2 CU endpoint (scale-to-zero)
- Postgres roles for application and developers
- Named database (`arsenal_fan_ops`) bound to the app

### Adopting Existing Lakebase Infrastructure

This repository adopts an **already-existing** Lakebase project rather than creating a new one. The adoption process:

1. Existing resources are declared with `replace_existing: true`
2. The bundle takes over management without destroying data
3. `lifecycle.prevent_destroy: true` on the project prevents accidental deletion

**Safe adoption steps:**

```bash
# 1. Verify existing infrastructure
databricks postgres list-projects -p your-profile
databricks postgres list-branches projects/arsenal-lakebase -p your-profile
databricks postgres list-databases projects/arsenal-lakebase/branches/production -p your-profile

# 2. Validate bundle (no changes made)
databricks bundle validate -t prod

# 3. Deploy — bundle adopts existing resources
databricks bundle deploy -t prod

# 4. Verify nothing was destroyed
databricks postgres list-branches projects/arsenal-lakebase -p your-profile
```

### Development Reset Workflow

The team periodically needs to refresh development with current production data/schema. Lakebase reset is a **full overwrite** of the child branch, which also resets branch-local Postgres roles and GRANTs.

```bash
# Reset development from production
./scripts/lakebase/reset-development.sh --profile your-profile

# What happens:
# 1. Verifies target is "development" (refuses production/uat)
# 2. Checks for child feature branches (aborts if any exist)
# 3. Prompts for confirmation
# 4. Resets development from production via Databricks CLI
# 5. Waits for branch and endpoint to become ready
# 6. Reapplies development-specific RBAC (db/permissions/apply_dev_permissions.sql)
# 7. Validates permissions
```

**Important:** If child feature branches exist under development, the reset will fail. Delete feature branches first:

```bash
./scripts/lakebase/delete-feature-branch.sh feature-james-xyz --profile your-profile
```

### Feature Branch Workflow

Developers create isolated branches from development for feature work:

```bash
# Create a feature branch
./scripts/lakebase/create-feature-branch.sh feature-james-xyz --profile your-profile

# Work on your feature...
# Feature branches inherit data + schema from development

# Delete when done
./scripts/lakebase/delete-feature-branch.sh feature-james-xyz --profile your-profile
```

**Critical:** Lakebase does **NOT** merge database branches from child → parent. Feature branches are **disposable environments**. Schema changes must be promoted through source-controlled migrations, not branch merging.

### Schema Migrations

Database schema changes live in `db/migrations/` and are applied through environments in order:

```
development → uat → production
```

**Workflow:**
1. Write migration SQL in `db/migrations/V00N__description.sql`
2. Test on a feature branch or development
3. Apply to UAT for business validation
4. Apply to production during deployment

**Migrations are NOT applied by copying database branches.** They are explicit SQL files tracked in Git.

### How the App Receives Its Lakebase Connection

The Databricks App resource binding in `resources/arsenal.app.yml` declares a `postgres` resource. When deployed, Databricks automatically injects:

| Variable | Description |
|----------|-------------|
| `PGHOST` | Lakebase endpoint hostname |
| `PGDATABASE` | Database name |
| `PGPORT` | Port (5432) |
| `PGUSER` | Service principal role |
| `PGSSLMODE` | SSL mode |

The application code in `server/data/fan_ops_db.py` detects `PGHOST` and connects using Databricks SDK OAuth token rotation. If Lakebase is unavailable, it falls back to in-memory SQLite for demo purposes.

### Validation

```bash
# Validate all permissions and infrastructure
./scripts/lakebase/validate-permissions.sh --profile your-profile

# Checks:
# ✓ Project exists
# ✓ Production branch exists and is protected
# ✓ Development branch exists
# ✓ UAT branch exists
# ✓ All endpoints are active
# ✓ Roles are correctly configured
```
