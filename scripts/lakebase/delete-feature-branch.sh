#!/usr/bin/env bash
# =============================================================================
# delete-feature-branch.sh — Safely delete a feature branch
# =============================================================================
# Deletes a Lakebase feature branch after safety checks (no reserved names,
# no child branches, user confirmation).
#
# Usage:
#   ./delete-feature-branch.sh BRANCH_NAME [--profile PROFILE] [--project PROJECT]
#
# Arguments:
#   BRANCH_NAME   Name of the feature branch to delete
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
BRANCH_NAME=""

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") BRANCH_NAME [OPTIONS]

Safely delete a Lakebase feature branch.

Arguments:
  BRANCH_NAME           Name of the feature branch to delete

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
# 1. SAFETY: Refuse reserved branch names
# ---------------------------------------------------------------------------
RESERVED=("production" "development" "uat" "main")
for reserved in "${RESERVED[@]}"; do
    if [[ "$BRANCH_NAME" == "$reserved" ]]; then
        fatal "Refusing to delete '${BRANCH_NAME}' — this is a protected branch."
    fi
done

info "Profile : ${BOLD}${PROFILE}${NC}"
info "Project : ${BOLD}${PROJECT}${NC}"
info "Branch  : ${BOLD}${BRANCH_NAME}${NC}"
echo ""

# ---------------------------------------------------------------------------
# 2. Check branch exists
# ---------------------------------------------------------------------------
info "Verifying branch '${BRANCH_NAME}' exists..."

if ! databricks postgres get-branch \
    "projects/${PROJECT}/branches/${BRANCH_NAME}" \
    --profile "${PROFILE}" \
    --output json >/dev/null 2>&1; then
    fatal "Branch '${BRANCH_NAME}' does not exist or could not be retrieved."
fi

success "Branch '${BRANCH_NAME}' found."
echo ""

# ---------------------------------------------------------------------------
# 3. Check for child branches
# ---------------------------------------------------------------------------
info "Checking for child branches under '${BRANCH_NAME}'..."

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
    if b.get('parent_branch', '') == 'projects/${PROJECT}/branches/${BRANCH_NAME}'
       or b.get('parent', '') == 'projects/${PROJECT}/branches/${BRANCH_NAME}'
]
for c in children:
    print(c)
" 2>/dev/null || true)

if [[ -n "$CHILDREN" ]]; then
    error "Cannot delete '${BRANCH_NAME}' — the following child branches exist:"
    echo ""
    echo "$CHILDREN" | while read -r child; do
        echo -e "  ${YELLOW}•${NC} ${child}"
    done
    echo ""
    fatal "Delete the child branches first, then retry."
fi

success "No child branches found."
echo ""

# ---------------------------------------------------------------------------
# 4. Confirmation prompt
# ---------------------------------------------------------------------------
echo -e "${RED}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}${BOLD}║  WARNING: This will permanently delete the branch        ║${NC}"
echo -e "${RED}${BOLD}║  '${BRANCH_NAME}' and all its data.$(printf '%*s' $((37 - ${#BRANCH_NAME})) '')║${NC}"
echo -e "${RED}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
read -rp "Type the branch name '${BRANCH_NAME}' to confirm deletion: " CONFIRM
if [[ "$CONFIRM" != "$BRANCH_NAME" ]]; then
    warn "Confirmation did not match. Aborted."
    exit 0
fi
echo ""

# ---------------------------------------------------------------------------
# 5. Delete the branch
# ---------------------------------------------------------------------------
info "Deleting branch '${BRANCH_NAME}'..."

databricks postgres delete-branch \
    "projects/${PROJECT}/branches/${BRANCH_NAME}" \
    --profile "${PROFILE}"

echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Branch '${BRANCH_NAME}' deleted successfully.$(printf '%*s' $((30 - ${#BRANCH_NAME})) '')║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
info "Profile : ${PROFILE}"
info "Project : ${PROJECT}"
info "Deleted : projects/${PROJECT}/branches/${BRANCH_NAME}"
echo ""
