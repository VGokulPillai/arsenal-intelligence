# Arsenal FC Football Intelligence Platform

Executive-grade club intelligence on **Databricks Apps**: React frontend, FastAPI backend, live football data, Foundation Models, and **Lakebase** (managed PostgreSQL) for fan-group operations.

This repository deploys as a **Databricks Asset Bundle (DAB)**. Lakebase (project, branches, endpoints, roles, database) and the app are declared in YAML and applied with `databricks bundle deploy`.

| Target | App name | Lakebase branch | Purpose |
|--------|----------|-----------------|--------|
| `dev` (default) | development-mode prefix | `development` | Day-to-day engineering |
| `uat` | `arsenal-intelligence-uat` | `uat` | Business validation before prod |
| `prod` | `arsenal-intelligence` | `production` (protected) | Live serving |

Clone: [github.com/VGokulPillai/arsenal-intelligence](https://github.com/VGokulPillai/arsenal-intelligence)

---

## How to deploy (DABs + Lakebase)

Do this in order the first time. After that, day-to-day deploys are **build frontend → `bundle deploy` → `bundle run`**.

### 1. Prerequisites

| Tool | Why |
|------|-----|
| [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install.html) **v1.0.0+** | Bundle resources include `postgres_projects`, `postgres_branches`, `postgres_endpoints`, `postgres_roles`, `postgres_databases` |
| Node.js 18+ | Frontend production build |
| Python 3.10+ | Local app / scripts |
| Workspace access | Serverless workspace with Apps + Lakebase. You need **CAN_MANAGE** on the Lakebase project to adopt it |

Check the CLI:

```bash
databricks --version
```

### 2. Authenticate

The bundle targets use profile `fe-vm-1acr1x` and host `https://fevm-serverless-stable-1acr1x.cloud.databricks.com`. Change `databricks.yml` if you are deploying to a different workspace.

```bash
databricks auth login \
  --host https://fevm-serverless-stable-1acr1x.cloud.databricks.com \
  --profile fe-vm-1acr1x

databricks auth profiles
```

Optional: `export DATABRICKS_PROFILE=fe-vm-1acr1x`

### 3. Point the bundle at your workspace

Edit `databricks.yml`:

- `targets.*.workspace.host` and `targets.*.workspace.profile`
- `variables.lakebase_project_id` (default `arsenal-lakebase`)
- `variables.app_sp_client_id` (app service principal used for the Postgres role)
- `variables.dev_group_name` / `uat_group_name` if you use different workspace groups

This repo **adopts** an existing Lakebase project. It does not wipe data. The project has `lifecycle.prevent_destroy: true`.

Confirm what already exists:

```bash
databricks postgres list-projects -p fe-vm-1acr1x
databricks postgres list-branches projects/arsenal-lakebase -p fe-vm-1acr1x
databricks postgres list-databases projects/arsenal-lakebase/branches/production -p fe-vm-1acr1x
```

### 4. Build the frontend

The app serves the Vite build. DAB sync excludes `frontend/src`, so you must build **before** every deploy.

```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Validate, then deploy the bundle

Pick a target. **Always validate before deploy.**

```bash
# Development (default)
databricks bundle validate -t dev
databricks bundle deploy -t dev

# UAT — dedicated app bound to the uat Lakebase branch
databricks bundle validate -t uat
databricks bundle deploy -t uat

# Production
databricks bundle validate -t prod
databricks bundle deploy -t prod
```

Add `--auto-approve` only in CI or when you have already reviewed the plan.

**What `bundle deploy` creates or adopts**

| Resource | Defined in | Notes |
|----------|------------|--------|
| Databricks App | `resources/arsenal.app.yml` | Source is the repo root (`source_code_path: ..`) |
| Lakebase project | `resources/arsenal.lakebase.yml` | `arsenal-lakebase`, Postgres 16, prevent destroy |
| Branches | same | `production` (protected), `uat`, `development` |
| Endpoints | same | Prod 4–8 CU, no suspend; UAT/dev 0.5–2 CU, scale-to-zero |
| App Postgres role | same | Service principal, no `createdb` / `createrole` |
| Database `arsenal_fan_ops` | same | Bound on production; child branches inherit it |

Dev and UAT bind the app to the matching **Lakebase branch**. Prod binds to the protected production branch and the named database resource.

### 6. Start the app

Apps do not stay running from deploy alone. Start (or restart) after a successful deploy:

```bash
databricks bundle run arsenal_app -t dev
databricks bundle run arsenal_app -t uat
databricks bundle run arsenal_app -t prod
```

Logs:

```bash
databricks apps logs arsenal-intelligence -p fe-vm-1acr1x
databricks apps logs arsenal-intelligence-uat -p fe-vm-1acr1x
```

Look for `Deployment successful` and `App started successfully`. The app injects `PGHOST`, `PGDATABASE`, `PGPORT`, `PGUSER` from the bundle Postgres binding. The backend in `server/data/fan_ops_db.py` uses Databricks SDK OAuth (no static DB password). If Lakebase is missing, it falls back to in-memory SQLite for demos.

### 7. Promote through environments

```
development  →  uat  →  production
```

1. Deploy and test `-t dev` (Lakebase `development` branch).
2. Deploy `-t uat`. Testers use `arsenal-intelligence-uat` against the `uat` branch.
3. After sign-off, deploy `-t prod`.

Schema changes are **SQL files in Git**, not Lakebase branch merges. Lakebase does **not** merge child → parent.

```
db/migrations/V00N__description.sql
```

Apply in order: development → UAT → production (see `scripts/lakebase/` and `db/permissions/`).

---

## Lakebase layout

```
production (protected)          live data, serving the prod app
├── uat                         business acceptance
└── development                 engineering
    └── feature-*               disposable (scripts, not the bundle)
```

| Branch | Persistence | Parent | Protected | App target |
|--------|-------------|--------|-----------|------------|
| `production` | Permanent | project | Yes | `-t prod` |
| `uat` | Permanent | production | No | `-t uat` |
| `development` | Permanent | production | No | `-t dev` |
| `feature-*` | Temporary | development | No | local / scripts |

**RBAC (branch-local GRANTs)** — SQL in `db/permissions/`:

| Branch | App service principal | Humans |
|--------|----------------------|--------|
| production | READ + WRITE on `arsenal_fan_ops`, `coaching`, `scouting` | READ only |
| development | READ + WRITE | `arsenal-dev` group READ + WRITE |
| uat | READ + WRITE | `arsenal-uat` group READ + WRITE |

No developer gets `DATABRICKS_SUPERUSER`, `BYPASSRLS`, or `CREATEROLE`. Project `CAN_USE` / `CAN_MANAGE` is not a substitute for schema GRANTs.

### Lakebase day-2 operations

These scripts sit **on top of** the bundle. They do not replace `bundle deploy`.

```bash
# Reset development from production, then reapply dev GRANTs
./scripts/lakebase/reset-development.sh --profile fe-vm-1acr1x

# Isolated feature work (not declared in the bundle)
./scripts/lakebase/create-feature-branch.sh feature-your-change --profile fe-vm-1acr1x
./scripts/lakebase/delete-feature-branch.sh feature-your-change --profile fe-vm-1acr1x

# Apply branch-specific SQL
./scripts/lakebase/apply-permissions.sh --profile fe-vm-1acr1x

# Check project, branches, endpoints, roles
./scripts/lakebase/validate-permissions.sh --profile fe-vm-1acr1x
```

Reset of `development` is a full overwrite. It refuses `production` and `uat`. Delete child feature branches first or the reset fails.

**Adopt existing Lakebase without data loss**

```bash
databricks bundle validate -t prod
databricks bundle deploy -t prod
databricks postgres list-branches projects/arsenal-lakebase -p fe-vm-1acr1x
```

Resources use `replace_existing: true` so the bundle takes over management instead of creating a second project.

### Connect with `psql` (optional)

```bash
databricks psql arsenal-lakebase -p fe-vm-1acr1x
```

---

## Local development (no deploy)

```bash
git clone https://github.com/VGokulPillai/arsenal-intelligence.git
cd arsenal-intelligence

pip install -r requirements.txt
export DATABRICKS_PROFILE=fe-vm-1acr1x
uvicorn app:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173, proxies /api to :8000
```

---

## Manual app deploy (not recommended)

Use this only if you cannot run the bundle. Lakebase still needs the YAML resources (or the UI) — this path deploys **code only**.

```bash
cd frontend && npm run build && cd ..

databricks apps create arsenal-intelligence \
  --description "Arsenal FC Football Intelligence Platform" \
  -p fe-vm-1acr1x

WORKSPACE_PATH="/Workspace/Users/your-email/apps/arsenal-intelligence"
databricks workspace import-dir . "$WORKSPACE_PATH" \
  --exclude node_modules --exclude .venv --exclude __pycache__ \
  --exclude .git --exclude frontend/node_modules \
  -p fe-vm-1acr1x --overwrite

databricks apps deploy arsenal-intelligence \
  --source-code-path "$WORKSPACE_PATH" \
  -p fe-vm-1acr1x
```

---

## Tear down

```bash
databricks bundle destroy -t dev
databricks bundle destroy -t uat --auto-approve
```

Do **not** destroy `-t prod` unless you intend to drop the production app. The Lakebase **project** is marked `prevent_destroy`; still treat `bundle destroy` as dangerous.

---

## Troubleshooting deploy

| Symptom | What to do |
|---------|------------|
| Validate fails on Postgres resources | Upgrade CLI to 1.0.0+ |
| App not reachable after deploy | `databricks bundle run arsenal_app -t <target>` |
| App cannot see Lakebase | Confirm the target binds the right branch; check `databricks apps logs …` for `PGHOST` |
| Wrong catalog/schema | Set `targets.<name>.variables.catalog` / `schema` |
| Feature-branch reset blocked | Delete `feature-*` children first |
| Permissions look wrong after reset | Re-run `apply-permissions.sh` then `validate-permissions.sh` |
| Frontend 404 / empty UI | You skipped `npm run build` |

---

## Environment variables

Set in `app.yaml` (app runtime), not in `databricks.yml`.

| Variable | Role | Required |
|----------|------|----------|
| `SERVING_ENDPOINT` | Foundation Model, e.g. `databricks-claude-sonnet-4-5` | Recommended |
| `CATALOG` / `SCHEMA` | Unity Catalog defaults | Optional |
| `API_FOOTBALL_KEY` | Live football data | Recommended |
| `DATABRICKS_WAREHOUSE_ID` | Delta queries | Optional |
| `PGHOST` / `PGDATABASE` / `PGPORT` / `PGUSER` | Injected from the bundle Postgres binding | Auto |

---

## What the platform does

- **Executive dashboard** — KPIs, alerts, next-match countdown
- **Live football** — API-Football standings, squad, fixtures, injuries
- **Audience & revenue** — attendance ML, pricing, commercial views
- **Sporting** — player metrics, health/fatigue, transfers, tactical board
- **Fan group ops** — Lakebase ticket allocations, check-in, issues, Genie
- **Copilot** — Foundation Models + RAG over live and Lakebase data

API-Football team id **42**, Premier League **39**. Sign up at [api-football.com](https://www.api-football.com/) and put the key in `app.yaml`.

### Architecture

```
React SPA  →  FastAPI (app.py :8000)
                ├─ API-Football
                ├─ Open-Meteo
                ├─ Foundation Models / Genie
                └─ Lakebase PostgreSQL (fan ops)
```

Fan ops serving path: Bronze → Silver → Gold (Delta) → **Lakebase** → App.

### Fan ops schema (`arsenal_fan_ops`)

| Table | Purpose |
|-------|---------|
| `fan_ops_groups` | Fan group registry |
| `fan_ops_fixtures` | Match schedule |
| `fan_ops_fans` | Fans linked to groups |
| `fan_ops_ticket_allocations` | Seats per fan per fixture |
| `fan_ops_checkin_events` | Matchday check-in |
| `fan_ops_group_issues` | Ops issues |
| `fan_ops_operational_notes` | Staff notes |

---

## Repo map

```
databricks.yml                 Bundle + targets (dev / uat / prod)
app.yaml                       App command + env
app.py                         FastAPI entry
resources/arsenal.app.yml      App + Postgres + serving endpoint
resources/arsenal.lakebase.yml Project, branches, endpoints, roles, database
scripts/lakebase/              Reset, feature branches, permissions
db/migrations/                 Versioned schema SQL
db/permissions/                Branch RBAC SQL
server/                        API, Lakebase access, ML
frontend/                      React + Vite (build before deploy)
```

---

Internal demo. Arsenal FC branding is illustrative only.
