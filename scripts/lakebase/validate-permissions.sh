#!/usr/bin/env bash
# =============================================================================
# validate-permissions.sh — Validate Lakebase infrastructure and RBAC
# =============================================================================
# Checks that the project, branches, endpoints, and roles are configured
# correctly across production, development, and UAT.
#
# Usage:
#   ./validate-permissions.sh [--profile PROFILE] [--project PROJECT]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass()  { PASS_COUNT=$((PASS_COUNT + 1)); echo -e "  ${GREEN}✓${NC} $*"; }
fail()  { FAIL_COUNT=$((FAIL_COUNT + 1)); echo -e "  ${RED}✗${NC} $*"; }
warn_c(){ WARN_COUNT=$((WARN_COUNT + 1)); echo -e "  ${YELLOW}⚠${NC} $*"; }

PROFILE="${DATABRICKS_PROFILE:-DEFAULT}"
PROJECT="arsenal-lakebase"

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Validate Lakebase infrastructure and RBAC across all branches.

Options:
  --profile PROFILE   Databricks CLI profile (default: \$DATABRICKS_PROFILE or "DEFAULT")
  --project PROJECT   Lakebase project name  (default: arsenal-lakebase)
  -h, --help          Show this help message
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --profile) PROFILE="$2"; shift 2 ;;
        --project) PROJECT="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}  Lakebase Infrastructure Validation${NC}"
echo -e "${CYAN}${BOLD}  Project: ${PROJECT}  |  Profile: ${PROFILE}${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ---------------------------------------------------------------------------
# 1. Project exists
# ---------------------------------------------------------------------------
echo -e "${BOLD}1. Project${NC}"
if databricks postgres get-project "projects/${PROJECT}" --profile "${PROFILE}" --output json >/dev/null 2>&1; then
    pass "Project '${PROJECT}' exists"
else
    fail "Project '${PROJECT}' not found"
fi
echo ""

# ---------------------------------------------------------------------------
# 2. Branches
# ---------------------------------------------------------------------------
echo -e "${BOLD}2. Branches${NC}"

for BRANCH in production development uat; do
    BRANCH_JSON=$(databricks postgres get-branch \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null || echo "{}")

    if echo "$BRANCH_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d.get('name','')" 2>/dev/null; then
        pass "Branch '${BRANCH}' exists"

        if [[ "$BRANCH" == "production" ]]; then
            IS_PROTECTED=$(echo "$BRANCH_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('is_protected', d.get('protected', False)))
" 2>/dev/null || echo "False")
            if [[ "$IS_PROTECTED" == "True" || "$IS_PROTECTED" == "true" ]]; then
                pass "Production branch is protected"
            else
                fail "Production branch is NOT protected"
            fi
        fi
    else
        fail "Branch '${BRANCH}' not found"
    fi
done
echo ""

# ---------------------------------------------------------------------------
# 3. Endpoints
# ---------------------------------------------------------------------------
echo -e "${BOLD}3. Endpoints${NC}"

for BRANCH in production development uat; do
    EP_JSON=$(databricks postgres list-endpoints \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null || echo "[]")

    EP_STATE=$(echo "$EP_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
endpoints = data if isinstance(data, list) else data.get('endpoints', [])
if endpoints:
    ep = endpoints[0]
    status = ep.get('status', ep)
    state = status.get('current_state', status.get('state', 'UNKNOWN'))
    print(state)
else:
    print('NOT_FOUND')
" 2>/dev/null || echo "UNKNOWN")

    if [[ "$EP_STATE" == "ACTIVE" ]]; then
        pass "Endpoint for '${BRANCH}' is ACTIVE"
    elif [[ "$EP_STATE" == "NOT_FOUND" ]]; then
        fail "No endpoint found for '${BRANCH}'"
    else
        warn_c "Endpoint for '${BRANCH}' state: ${EP_STATE}"
    fi
done
echo ""

# ---------------------------------------------------------------------------
# 4. Roles (per branch)
# ---------------------------------------------------------------------------
echo -e "${BOLD}4. Roles${NC}"

for BRANCH in production development uat; do
    ROLES_JSON=$(databricks postgres list-roles \
        "projects/${PROJECT}/branches/${BRANCH}" \
        --profile "${PROFILE}" \
        --output json 2>/dev/null || echo "[]")

    ROLE_COUNT=$(echo "$ROLES_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
roles = data if isinstance(data, list) else data.get('roles', [])
print(len(roles))
" 2>/dev/null || echo "0")

    if [[ "$ROLE_COUNT" -gt 0 ]]; then
        pass "Branch '${BRANCH}' has ${ROLE_COUNT} role(s)"

        echo "$ROLES_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
roles = data if isinstance(data, list) else data.get('roles', [])
for r in roles:
    status = r.get('status', r)
    pg_role = status.get('postgres_role', 'unknown')
    identity = status.get('identity_type', 'unknown')
    memberships = status.get('membership_roles', [])
    attrs = status.get('attributes', {})
    superuser = 'DATABRICKS_SUPERUSER' in memberships
    print(f'      {pg_role} ({identity}) superuser={superuser} createdb={attrs.get(\"createdb\", False)} createrole={attrs.get(\"createrole\", False)}')
" 2>/dev/null || true

    else
        warn_c "Branch '${BRANCH}' has no roles"
    fi
done
echo ""

# ---------------------------------------------------------------------------
# 5. Databases (production)
# ---------------------------------------------------------------------------
echo -e "${BOLD}5. Databases${NC}"

DBS_JSON=$(databricks postgres list-databases \
    "projects/${PROJECT}/branches/production" \
    --profile "${PROFILE}" \
    --output json 2>/dev/null || echo "[]")

DB_COUNT=$(echo "$DBS_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
dbs = data if isinstance(data, list) else data.get('databases', [])
count = len(dbs)
print(count)
for db in dbs:
    name = db.get('name', 'unknown')
    status = db.get('status', {})
    pg_name = status.get('postgres_database', db.get('postgres_database', 'unknown'))
    sys.stderr.write(f'      {pg_name} ({name})\n')
" 2>&1 1>/dev/null || echo "0")

DB_INFO=$(echo "$DBS_JSON" | python3 -c "
import json, sys
data = json.load(sys.stdin)
dbs = data if isinstance(data, list) else data.get('databases', [])
print(len(dbs))
for db in dbs:
    name = db.get('name', 'unknown')
    status = db.get('status', {})
    pg_name = status.get('postgres_database', db.get('postgres_database', 'unknown'))
    print(f'      {pg_name} ({name})')
" 2>/dev/null || echo "0")

DB_COUNT=$(echo "$DB_INFO" | head -1)

if [[ -n "$DB_COUNT" ]] && [[ "$DB_COUNT" -gt 0 ]] 2>/dev/null; then
    pass "Production has ${DB_COUNT} database(s)"
    echo "$DB_INFO" | tail -n +2
else
    warn_c "No databases found on production"
fi
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
echo -e "  ${GREEN}${PASS_COUNT} passed${NC}  ${RED}${FAIL_COUNT} failed${NC}  ${YELLOW}${WARN_COUNT} warnings${NC}  (${TOTAL} checks)"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
    echo ""
    echo -e "  ${RED}${BOLD}VALIDATION FAILED${NC} — ${FAIL_COUNT} check(s) did not pass."
    exit 1
else
    echo ""
    echo -e "  ${GREEN}${BOLD}VALIDATION PASSED${NC}"
    exit 0
fi
