#!/usr/bin/env bash
# =============================================================================
# create-feature-branch.sh — Create an ephemeral feature branch from development
# =============================================================================
# Creates a new Lakebase branch off 'development' with a read-write endpoint
# for isolated feature work.
#
# Usage:
#   ./create-feature-branch.sh BRANCH_NAME [--profile PROFILE] [--project PROJECT]
#
# Arguments:
#   BRANCH_NAME   Name for the new branch (lowercase, alphanumeric + hyphens, 3-63 chars)
#
# Options:
#   --profile     Databricks CLI profile (default: $DATABRICKS_PROFILE or "DEFAULT")
#   --project     Lakebase project name  (default: arsenal-lakebase)
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
NC='\033[0m'

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
PARENT="development"
BRANCH_NAME=""
POLL_INTERVAL=10
TIMEOUT=300

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") BRANCH_NAME [OPTIONS]

Create an ephemeral feature branch from '${PARENT}' with a read-write endpoint.

Arguments:
  BRANCH_NAME           Name for the new branch
                        • lowercase, alphanumeric + hyphens only
                        • 3–63 characters
                        • must not be a reserved name (production, development, uat, main)

Options:
  --profile PROFILE     Databricks CLI profile (default: \$DATABRICKS_PROFILE or "DEFAULT")
  --project PROJECT     Lakebase project name  (default: arsenal-lakebase)
  -h, --help            Show this help message

Examples:
  $(basename "$0") feat-match-analytics
  $(basename "$0") fix-scouting-etl --profile dev-profile
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --profile) PROFILE="$2"; shift 2 ;;
        --project) PROJECT="$2"; shift 2 ;;
        -h|--help) usage ;;
        -*)        fatal "Unknown option: $1. Use --help for usage." ;;
        *)
            if [[ -z "$BRANCH_NAME" ]]; then
                BRANCH_NAME="$1"; shift
            else
                fatal "Unexpected argument: $1. Use --help for usage."
            fi
            ;;
    esac
done

if [[ -z "$BRANCH_NAME" ]]; then
    fatal "BRANCH_NAME is required. Use --help for usage."
fi

# ---------------------------------------------------------------------------
# 1. Validate branch name format
# ---------------------------------------------------------------------------
if [[ ${#BRANCH_NAME} -lt 3 || ${#BRANCH_NAME} -gt 63 ]]; then
    fatal "Branch name must be 3–63 characters. Got ${#BRANCH_NAME}: '${BRANCH_NAME}'"
fi

if ! [[ "$BRANCH_NAME" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$ ]]; then
    fatal "Branch name must be lowercase alphanumeric with hyphens only (no leading/trailing hyphens): '${BRANCH_NAME}'"
fi

# ---------------------------------------------------------------------------
# 2. SAFETY: Refuse reserved names
# ---------------------------------------------------------------------------
RESERVED=("production" "development" "uat" "main")
for reserved in "${RESERVED[@]}"; do
    if [[ "$BRANCH_NAME" == "$reserved" ]]; then
        fatal "Refusing to create branch '${BRANCH_NAME}' — this is a reserved branch name."
    fi
done

info "Profile : ${BOLD}${PROFILE}${NC}"
info "Project : ${BOLD}${PROJECT}${NC}"
info "Branch  : ${BOLD}${BRANCH_NAME}${NC}  ←  ${BOLD}${PARENT}${NC}"
echo ""

# ---------------------------------------------------------------------------
# 3. Check branch doesn't already exist
# ---------------------------------------------------------------------------
info "Checking if branch '${BRANCH_NAME}' already exists..."

if databricks postgres get-branch \
    "projects/${PROJECT}/branches/${BRANCH_NAME}" \
    --profile "${PROFILE}" \
    --output json >/dev/null 2>&1; then
    fatal "Branch '${BRANCH_NAME}' already exists. Delete it first or choose a different name."
fi

success "Branch name '${BRANCH_NAME}' is available."
echo ""

# ---------------------------------------------------------------------------
# 4. Create the branch
# ---------------------------------------------------------------------------
info "Creating branch '${BRANCH_NAME}' from '${PARENT}'..."

databricks postgres create-branch \
    "projects/${PROJECT}/branches/${BRANCH_NAME}" \
    --parent "projects/${PROJECT}/branches/${PARENT}" \
    --profile "${PROFILE}"

success "Branch creation initiated."
echo ""

# ---------------------------------------------------------------------------
# 5. Create a read-write endpoint for the branch
# ---------------------------------------------------------------------------
info "Creating read-write endpoint for '${BRANCH_NAME}'..."

databricks postgres create-endpoint \
    "projects/${PROJECT}/branches/${BRANCH_NAME}/endpoints/primary" \
    --endpoint-type ENDPOINT_TYPE_READ_WRITE \
    --autoscaling-limit-min-cu 0.5 \
    --autoscaling-limit-max-cu 1 \
    --profile "${PROFILE}"

success "Endpoint creation initiated."
echo ""

# ---------------------------------------------------------------------------
# 6. Wait for branch to become READY
# ---------------------------------------------------------------------------
info "Waiting for branch '${BRANCH_NAME}' to become READY (timeout: ${TIMEOUT}s)..."

elapsed=0
while (( elapsed < TIMEOUT )); do
    STATE=$(databricks postgres get-branch \
        "projects/${PROJECT}/branches/${BRANCH_NAME}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null \
        | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('state','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

    if [[ "$STATE" == "READY" || "$STATE" == "STATE_READY" || "$STATE" == "ACTIVE" ]]; then
        success "Branch '${BRANCH_NAME}' is READY."
        break
    fi

    info "  Branch state: ${STATE} ... waiting ${POLL_INTERVAL}s (${elapsed}/${TIMEOUT}s)"
    sleep "$POLL_INTERVAL"
    elapsed=$(( elapsed + POLL_INTERVAL ))
done

if (( elapsed >= TIMEOUT )); then
    fatal "Timed out waiting for branch '${BRANCH_NAME}' to become READY after ${TIMEOUT}s."
fi
echo ""

# ---------------------------------------------------------------------------
# 7. Wait for endpoint to become ACTIVE
# ---------------------------------------------------------------------------
info "Waiting for endpoint to become ACTIVE..."

elapsed=0
while (( elapsed < TIMEOUT )); do
    EP_STATE=$(databricks postgres list-endpoints \
        "projects/${PROJECT}/branches/${BRANCH_NAME}" \
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
        success "Endpoint is ACTIVE."
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
# 8. Print connection details
# ---------------------------------------------------------------------------
EP_HOST=$(databricks postgres list-endpoints \
    "projects/${PROJECT}/branches/${BRANCH_NAME}" \
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

echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Feature branch created successfully!                     ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Branch   : projects/${PROJECT}/branches/${BRANCH_NAME}"
info "Parent   : projects/${PROJECT}/branches/${PARENT}"
info "Endpoint : ${BOLD}${EP_HOST}${NC}"
info "Profile  : ${PROFILE}"
echo ""
echo -e "${CYAN}${BOLD}── Connection ──────────────────────────────────────────────${NC}"
echo ""
echo "  psql -h ${EP_HOST}"
echo ""
echo -e "${CYAN}${BOLD}── Cleanup ─────────────────────────────────────────────────${NC}"
echo ""
echo "  When done, delete this branch to free resources:"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "  ${SCRIPT_DIR}/delete-feature-branch.sh ${BRANCH_NAME} --profile ${PROFILE} --project ${PROJECT}"
echo ""
