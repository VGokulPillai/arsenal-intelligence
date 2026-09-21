#!/usr/bin/env bash
# =============================================================================
# apply-permissions.sh — Apply permission SQL to a specific branch
# =============================================================================
# Maps a branch name to its permission SQL file and prints instructions
# for applying it.
#
# Usage:
#   ./apply-permissions.sh BRANCH_NAME [--profile PROFILE] [--project PROJECT]
# =============================================================================
set -euo pipefail

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

PROFILE="${DATABRICKS_PROFILE:-DEFAULT}"
PROJECT="arsenal-lakebase"
BRANCH_NAME=""

usage() {
    cat <<EOF
Usage: $(basename "$0") BRANCH_NAME [OPTIONS]

Apply the permission SQL file for a specific Lakebase branch.

Arguments:
  BRANCH_NAME   One of: production, development, uat

Options:
  --profile PROFILE   Databricks CLI profile (default: \$DATABRICKS_PROFILE or "DEFAULT")
  --project PROJECT   Lakebase project name  (default: arsenal-lakebase)
  -h, --help          Show this help message

Examples:
  $(basename "$0") development --profile fe-vm-1acr1x
  $(basename "$0") production
  $(basename "$0") uat
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
# Map branch to SQL file
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

case "$BRANCH_NAME" in
    production)
        SQL_FILE="${REPO_ROOT}/db/permissions/apply_prod_permissions.sql"
        ;;
    development)
        SQL_FILE="${REPO_ROOT}/db/permissions/apply_dev_permissions.sql"
        ;;
    uat)
        SQL_FILE="${REPO_ROOT}/db/permissions/apply_uat_permissions.sql"
        ;;
    *)
        fatal "Unknown branch '${BRANCH_NAME}'. Supported: production, development, uat"
        ;;
esac

if [[ ! -f "$SQL_FILE" ]]; then
    fatal "SQL file not found: ${SQL_FILE}"
fi

info "Profile : ${BOLD}${PROFILE}${NC}"
info "Project : ${BOLD}${PROJECT}${NC}"
info "Branch  : ${BOLD}${BRANCH_NAME}${NC}"
info "SQL file: ${BOLD}${SQL_FILE}${NC}"
echo ""

# ---------------------------------------------------------------------------
# Get endpoint hostname
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
    status = ep.get('status', ep)
    hosts = status.get('hosts', {})
    host = hosts.get('host', status.get('hostname', 'N/A'))
    print(host)
    break
else:
    print('N/A')
" 2>/dev/null || echo "N/A")

info "Endpoint: ${BOLD}${EP_HOST}${NC}"
echo ""

# ---------------------------------------------------------------------------
# Attempt to apply via psql if available
# ---------------------------------------------------------------------------
if command -v psql >/dev/null 2>&1; then
    echo -e "${CYAN}${BOLD}── psql detected ───────────────────────────────────────────${NC}"
    echo ""
    read -rp "Apply permissions via psql now? (yes/no): " APPLY_NOW
    if [[ "$APPLY_NOW" == "yes" ]]; then
        info "Applying ${SQL_FILE} to ${EP_HOST}..."
        psql -h "${EP_HOST}" -f "${SQL_FILE}" && \
            success "Permissions applied successfully." || \
            fatal "Failed to apply permissions."
        exit 0
    fi
fi

# ---------------------------------------------------------------------------
# Print manual instructions
# ---------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}── Apply Permissions ────────────────────────────────────────${NC}"
echo ""
echo "  Run the following command to apply permissions:"
echo ""
echo -e "  ${YELLOW}psql -h ${EP_HOST} -f ${SQL_FILE}${NC}"
echo ""
echo "  Or use your preferred PostgreSQL client to execute:"
echo -e "  ${BOLD}${SQL_FILE}${NC}"
echo ""
echo "  against the ${BRANCH_NAME} endpoint: ${BOLD}${EP_HOST}${NC}"
echo ""
