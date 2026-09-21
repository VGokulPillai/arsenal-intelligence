#!/usr/bin/env bash
# =============================================================================
# reset-development.sh — Reset development branch from production
# =============================================================================
# Resets the Lakebase development branch to match production, then prints
# instructions for reapplying dev permissions.
#
# Usage:
#   ./reset-development.sh [--profile PROFILE] [--project PROJECT]
#
# Options:
#   --profile   Databricks CLI profile (default: $DATABRICKS_PROFILE or "DEFAULT")
#   --project   Lakebase project name  (default: arsenal-lakebase)
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
fatal()   { error "$@"; exit 1; }

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
PROFILE="${DATABRICKS_PROFILE:-DEFAULT}"
PROJECT="arsenal-lakebase"
BRANCH="development"
PARENT="production"
POLL_INTERVAL=10
TIMEOUT=300

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Reset the '${BRANCH}' branch from '${PARENT}', then print instructions
for reapplying development permissions.

Options:
  --profile PROFILE   Databricks CLI profile (default: \$DATABRICKS_PROFILE or "DEFAULT")
  --project PROJECT   Lakebase project name  (default: arsenal-lakebase)
  -h, --help          Show this help message

Examples:
  $(basename "$0")
  $(basename "$0") --profile my-profile --project my-lakebase
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --profile) PROFILE="$2"; shift 2 ;;
        --project) PROJECT="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) fatal "Unknown option: $1. Use --help for usage." ;;
    esac
done

# ---------------------------------------------------------------------------
# 1. SAFETY: Only allow resetting 'development'
# ---------------------------------------------------------------------------
if [[ "$BRANCH" == "production" || "$BRANCH" == "uat" || "$BRANCH" == "main" ]]; then
    fatal "Refusing to reset branch '${BRANCH}'. This script only resets 'development'."
fi

info "Profile : ${BOLD}${PROFILE}${NC}"
info "Project : ${BOLD}${PROJECT}${NC}"
info "Target  : ${BOLD}${BRANCH}${NC}  ←  ${BOLD}${PARENT}${NC}"
echo ""

# ---------------------------------------------------------------------------
# 2. Check for child branches under development
# ---------------------------------------------------------------------------
info "Checking for child branches under '${BRANCH}'..."

CHILDREN=$(databricks postgres list-branches "projects/${PROJECT}" \
    --profile "${PROFILE}" \
    --output json 2>/dev/null \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
branches = data if isinstance(data, list) else data.get('branches', [])
children = [
    b.get('name', b.get('branch_id', 'unknown'))
    for b in branches
    if b.get('parent_branch', '') == 'projects/${PROJECT}/branches/${BRANCH}'
       or b.get('parent', '') == 'projects/${PROJECT}/branches/${BRANCH}'
]
for c in children:
    print(c)
" 2>/dev/null || true)

if [[ -n "$CHILDREN" ]]; then
    error "Cannot reset '${BRANCH}' — the following child branches exist:"
    echo ""
    echo "$CHILDREN" | while read -r child; do
        echo -e "  ${YELLOW}•${NC} ${child}"
    done
    echo ""
    error "Delete these branches first, then retry."
    error "  ./delete-feature-branch.sh <branch-name> --profile ${PROFILE} --project ${PROJECT}"
    exit 1
fi

success "No child branches found under '${BRANCH}'."
echo ""

# ---------------------------------------------------------------------------
# 3. Confirmation prompt
# ---------------------------------------------------------------------------
echo -e "${RED}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║  WARNING: This will OVERWRITE development with           ║${NC}"
echo -e "${RED}${BOLD}║  production data. All uncommitted dev changes are lost.   ║${NC}"
echo -e "${RED}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
read -rp "Type 'yes' to continue: " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    warn "Aborted by user."
    exit 0
fi
echo ""

# ---------------------------------------------------------------------------
# 4. Reset development from production
# ---------------------------------------------------------------------------
info "Resetting '${BRANCH}' from '${PARENT}'..."

databricks postgres reset-branch \
    "projects/${PROJECT}/branches/${BRANCH}" \
    --parent "projects/${PROJECT}/branches/${PARENT}" \
    --profile "${PROFILE}"

success "Reset command accepted."
echo ""

# ---------------------------------------------------------------------------
# 5. Wait for branch to become READY
# ---------------------------------------------------------------------------
info "Waiting for branch '${BRANCH}' to become READY (timeout: ${TIMEOUT}s)..."

elapsed=0
while (( elapsed < TIMEOUT )); do
    STATE=$(databricks postgres get-branch \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null \
        | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('state','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

    if [[ "$STATE" == "READY" || "$STATE" == "STATE_READY" || "$STATE" == "ACTIVE" ]]; then
        success "Branch '${BRANCH}' is READY."
        break
    fi

    info "  Branch state: ${STATE} ... waiting ${POLL_INTERVAL}s (${elapsed}/${TIMEOUT}s)"
    sleep "$POLL_INTERVAL"
    elapsed=$(( elapsed + POLL_INTERVAL ))
done

if (( elapsed >= TIMEOUT )); then
    fatal "Timed out waiting for branch '${BRANCH}' to become READY after ${TIMEOUT}s."
fi
echo ""

# ---------------------------------------------------------------------------
# 6. Wait for endpoint to become ACTIVE
# ---------------------------------------------------------------------------
info "Waiting for development endpoint to become ACTIVE..."

elapsed=0
while (( elapsed < TIMEOUT )); do
    EP_STATE=$(databricks postgres list-endpoints \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null \
        | python3 -c "
import json, sys
data = json.load(sys.stdin)
endpoints = data if isinstance(data, list) else data.get('endpoints', [])
for ep in endpoints:
    state = ep.get('current_state', ep.get('state', 'UNKNOWN'))
    print(state)
    break
else:
    print('NOT_FOUND')
" 2>/dev/null || echo "UNKNOWN")

    if [[ "$EP_STATE" == "ACTIVE" || "$EP_STATE" == "STATE_ACTIVE" || "$EP_STATE" == "ENDPOINT_STATE_ACTIVE" ]]; then
        success "Development endpoint is ACTIVE."
        break
    fi

    info "  Endpoint state: ${EP_STATE} ... waiting ${POLL_INTERVAL}s (${elapsed}/${TIMEOUT}s)"
    sleep "$POLL_INTERVAL"
    elapsed=$(( elapsed + POLL_INTERVAL ))
done

if (( elapsed >= TIMEOUT )); then
    fatal "Timed out waiting for endpoint to become ACTIVE after ${TIMEOUT}s."
fi
echo ""

# ---------------------------------------------------------------------------
# 7. Apply dev permissions — print instructions
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PERMISSIONS_FILE="${REPO_ROOT}/db/permissions/apply_dev_permissions.sql"

if [[ ! -f "$PERMISSIONS_FILE" ]]; then
    warn "Permission SQL file not found at: ${PERMISSIONS_FILE}"
    warn "Skipping permission application step."
else
    echo -e "${CYAN}${BOLD}── Dev Permissions ──────────────────────────────────────────${NC}"
    echo ""
    info "The development branch has been reset. You must now reapply"
    info "dev permissions so developer roles regain write access."
    echo ""
    info "SQL file: ${BOLD}${PERMISSIONS_FILE}${NC}"
    echo ""
    # Retrieve the endpoint hostname for convenience
    EP_HOST=$(databricks postgres list-endpoints \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null \
        | python3 -c "
import json, sys
data = json.load(sys.stdin)
endpoints = data if isinstance(data, list) else data.get('endpoints', [])
for ep in endpoints:
    host = ep.get('hostname', ep.get('host', ep.get('uri', 'N/A')))
    print(host)
    break
else:
    print('N/A')
" 2>/dev/null || echo "N/A")

    info "Endpoint : ${BOLD}${EP_HOST}${NC}"
    echo ""
    echo -e "  ${YELLOW}Option A — psql (if available):${NC}"
    echo "    psql -h ${EP_HOST} -f ${PERMISSIONS_FILE}"
    echo ""
    echo -e "  ${YELLOW}Option B — apply-permissions.sh helper:${NC}"
    echo "    ${SCRIPT_DIR}/apply-permissions.sh development --profile ${PROFILE} --project ${PROJECT}"
    echo ""
fi

# ---------------------------------------------------------------------------
# 8. Run basic validation queries
# ---------------------------------------------------------------------------
info "Running basic validation..."

VALIDATION_PASSED=true

# Validate connectivity with SELECT 1
if databricks postgres execute-statement \
    "projects/${PROJECT}/branches/${BRANCH}/endpoints/primary" \
    --statement "SELECT 1 AS health_check" \
    --profile "${PROFILE}" \
    --output json >/dev/null 2>&1; then
    success "SELECT 1 — connectivity OK"
else
    warn "SELECT 1 — could not verify connectivity (non-fatal)"
    VALIDATION_PASSED=false
fi

# Validate schemas exist
for SCHEMA in arsenal_fan_ops coaching scouting; do
    if databricks postgres execute-statement \
        "projects/${PROJECT}/branches/${BRANCH}/endpoints/primary" \
        --statement "SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${SCHEMA}'" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data.get('result', {}).get('data_array', data.get('rows', []))
sys.exit(0 if rows else 1)
" 2>/dev/null; then
        success "Schema '${SCHEMA}' exists"
    else
        warn "Schema '${SCHEMA}' — could not verify (non-fatal)"
        VALIDATION_PASSED=false
    fi
done

echo ""

# ---------------------------------------------------------------------------
# 9. Summary
# ---------------------------------------------------------------------------
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Development branch reset complete!                       ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Branch  : projects/${PROJECT}/branches/${BRANCH}"
info "Parent  : projects/${PROJECT}/branches/${PARENT}"
info "Profile : ${PROFILE}"
if [[ "$VALIDATION_PASSED" == "true" ]]; then
    success "All validation checks passed."
else
    warn "Some validation checks could not be verified. Review warnings above."
fi
echo ""
info "Next step: Apply dev permissions using the instructions above."
