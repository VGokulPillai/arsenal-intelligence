"""Copilot / Genie API — queries Lakebase for fan operations data."""
from fastapi import APIRouter
from pydantic import BaseModel
import logging

from server.data import fan_ops_db

router = APIRouter(prefix="/copilot", tags=["copilot"])
logger = logging.getLogger(__name__)


class AskRequest(BaseModel):
    message: str


def _db_source_label() -> str:
    """Return a label indicating the data source."""
    try:
        from server.data.fan_ops_db import _use_postgres, _pg_failed
        if _use_postgres() and not _pg_failed:
            return "🗄️ *Data source: Databricks Lakebase (PostgreSQL)*"
        return "🗄️ *Data source: In-memory SQLite (demo mode)*"
    except Exception:
        return ""


def _query_fan_groups() -> str:
    """Query all fan groups from Lakebase."""
    try:
        rows = fan_ops_db.execute_query(
            "SELECT group_id, group_name, region, group_type, member_count, primary_contact, contact_email "
            "FROM fan_ops_groups ORDER BY member_count DESC"
        )
        if not rows:
            return "No fan groups found in the database."
        
        lines = ["**All Registered Fan Groups:**\n"]
        lines.append("| # | Group Name | Region | Type | Members | Contact |")
        lines.append("|---|-----------|--------|------|---------|---------|")
        for i, r in enumerate(rows, 1):
            lines.append(
                f"| {i} | {r.get('group_name', '?')} | {r.get('region', '?')} | "
                f"{r.get('group_type', '?')} | {r.get('member_count', 0)} | "
                f"{r.get('primary_contact', '?')} |"
            )
        lines.append(f"\n**Total: {len(rows)} fan groups**")
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Fan group query failed: %s", e)
        return f"Error querying fan groups: {e}"


def _query_pending_tickets(opponent: str | None = None) -> str:
    """Query pending tickets from Lakebase."""
    try:
        sql = """
            SELECT g.group_name, g.region, COUNT(*) as pending_count
            FROM fan_ops_ticket_allocations t
            JOIN fan_ops_groups g ON t.fan_group_id = g.group_id
            WHERE t.ticket_status = 'pending'
        """
        params: list = []
        if opponent:
            sql += " AND t.fixture_id IN (SELECT match_id FROM fan_ops_fixtures WHERE opponent ILIKE %s)"
            params.append(f"%{opponent}%")
        sql += " GROUP BY g.group_name, g.region ORDER BY pending_count DESC"
        
        rows = fan_ops_db.execute_query(sql, tuple(params))
        if not rows:
            return "No pending tickets found."
        
        lines = ["**Fan Groups with Pending Tickets:**\n"]
        lines.append("| Group | Region | Pending Tickets |")
        lines.append("|-------|--------|----------------|")
        total = 0
        for r in rows:
            cnt = r.get('pending_count', 0)
            total += cnt
            lines.append(f"| {r.get('group_name', '?')} | {r.get('region', '?')} | {cnt} |")
        lines.append(f"\n**Total pending: {total} tickets across {len(rows)} groups**")
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Pending tickets query failed: %s", e)
        return f"Error querying pending tickets: {e}"


def _query_international_attendance() -> str:
    """Query international fan group attendance from Lakebase."""
    try:
        rows = fan_ops_db.execute_query("""
            SELECT g.group_name, g.region, g.member_count,
                   COUNT(c.checkin_id) as checkins
            FROM fan_ops_groups g
            LEFT JOIN fan_ops_fans f ON f.fan_group_id = g.group_id
            LEFT JOIN fan_ops_checkin_events c ON c.fan_id = f.fan_id
            WHERE g.group_type = 'international'
            GROUP BY g.group_id, g.group_name, g.region, g.member_count
            ORDER BY checkins DESC
        """)
        if not rows:
            return "No international fan group attendance data found."
        
        lines = ["**International Fan Group Attendance:**\n"]
        lines.append("| Group | Region | Members | Check-ins |")
        lines.append("|-------|--------|---------|-----------|")
        for r in rows:
            lines.append(f"| {r.get('group_name', '?')} | {r.get('region', '?')} | {r.get('member_count', 0)} | {r.get('checkins', 0)} |")
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("International attendance query failed: %s", e)
        return f"Error querying attendance: {e}"


def _query_accessibility() -> str:
    """Query accessibility requests from Lakebase."""
    try:
        rows = fan_ops_db.execute_query("""
            SELECT g.group_name, g.region, g.member_count, g.accessibility_requirements
            FROM fan_ops_groups g
            WHERE g.accessibility_requirements IS NOT NULL
              AND g.accessibility_requirements != ''
              AND g.accessibility_requirements != 'none'
            ORDER BY g.member_count DESC
        """)
        if not rows:
            return "No fan groups with accessibility requests found."
        
        lines = ["**Fan Groups with Accessibility Requests:**\n"]
        for r in rows:
            lines.append(f"- **{r.get('group_name', '?')}** ({r.get('region', '?')}, {r.get('member_count', 0)} members)")
            lines.append(f"  Requirement: {r.get('accessibility_requirements', 'N/A')}")
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Accessibility query failed: %s", e)
        return f"Error querying accessibility: {e}"


def _query_cancellations() -> str:
    """Query cancellation stats from Lakebase."""
    try:
        rows = fan_ops_db.execute_query("""
            SELECT g.group_name, g.region, g.group_type,
                   COUNT(*) as cancellations,
                   ROUND(COUNT(*) * 100.0 / NULLIF(g.member_count, 0), 1) as cancel_rate
            FROM fan_ops_ticket_allocations t
            JOIN fan_ops_groups g ON t.fan_group_id = g.group_id
            WHERE t.ticket_status = 'cancelled'
            GROUP BY g.group_id, g.group_name, g.region, g.group_type, g.member_count
            ORDER BY cancellations DESC
            LIMIT 10
        """)
        if not rows:
            return "No cancellations found in the database."
        
        lines = ["**Fan Groups with Most Cancellations This Season:**\n"]
        lines.append("| Group | Region | Type | Cancellations | Rate |")
        lines.append("|-------|--------|------|--------------|------|")
        for r in rows:
            lines.append(
                f"| {r.get('group_name', '?')} | {r.get('region', '?')} | "
                f"{r.get('group_type', '?')} | {r.get('cancellations', 0)} | "
                f"{r.get('cancel_rate', 0)}% |"
            )
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Cancellations query failed: %s", e)
        return f"Error querying cancellations: {e}"


def _query_not_checked_in() -> str:
    """Query groups that haven't checked in from Lakebase."""
    try:
        rows = fan_ops_db.execute_query("""
            SELECT g.group_name, g.region,
                   COUNT(DISTINCT t.ticket_id) as total_tickets,
                   COUNT(DISTINCT c.checkin_id) as checked_in,
                   COUNT(DISTINCT t.ticket_id) - COUNT(DISTINCT c.checkin_id) as not_checked_in
            FROM fan_ops_groups g
            JOIN fan_ops_ticket_allocations t ON t.fan_group_id = g.group_id
            LEFT JOIN fan_ops_checkin_events c ON c.fan_id = t.fan_id AND c.fixture_id = t.fixture_id
            WHERE t.ticket_status = 'confirmed'
            GROUP BY g.group_id, g.group_name, g.region
            HAVING COUNT(DISTINCT t.ticket_id) - COUNT(DISTINCT c.checkin_id) > 0
            ORDER BY not_checked_in DESC
            LIMIT 10
        """)
        if not rows:
            return "All groups have checked in."
        
        lines = ["**Fan Groups Not Fully Checked In:**\n"]
        lines.append("| Group | Region | Total | Checked In | Missing |")
        lines.append("|-------|--------|-------|-----------|---------|")
        for r in rows:
            lines.append(
                f"| {r.get('group_name', '?')} | {r.get('region', '?')} | "
                f"{r.get('total_tickets', 0)} | {r.get('checked_in', 0)} | "
                f"{r.get('not_checked_in', 0)} |"
            )
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Check-in query failed: %s", e)
        return f"Error querying check-ins: {e}"


def _query_matchday_support() -> str:
    """Query open issues from Lakebase."""
    try:
        rows = fan_ops_db.execute_query("""
            SELECT i.issue_id, g.group_name, i.issue_type, i.description, i.created_at
            FROM fan_ops_group_issues i
            JOIN fan_ops_groups g ON i.fan_group_id = g.group_id
            WHERE i.status = 'open'
            ORDER BY i.created_at DESC
        """)
        if not rows:
            return "No open matchday support issues."
        
        lines = ["**Fan Groups Needing Matchday Support (Open Issues):**\n"]
        for i, r in enumerate(rows, 1):
            lines.append(f"{i}. **{r.get('group_name', '?')}** — {r.get('issue_type', '?')}")
            lines.append(f"   {r.get('description', 'No details')}")
        lines.append(f"\n**Total open issues: {len(rows)}**")
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Support issues query failed: %s", e)
        return f"Error querying issues: {e}"


def _query_dashboard_summary() -> str:
    """Query overall fan ops summary from Lakebase."""
    try:
        stats = fan_ops_db.get_dashboard_stats()
        groups = fan_ops_db.execute_query(
            "SELECT group_type, COUNT(*) as cnt FROM fan_ops_groups GROUP BY group_type ORDER BY cnt DESC"
        )
        
        lines = ["**Fan Group Operations Summary (Live from Lakebase):**\n"]
        lines.append(f"- **{stats.get('total_groups', 0)}** registered fan groups")
        lines.append(f"- **{stats.get('total_allocated', 0)}** total tickets allocated")
        lines.append(f"- **{stats.get('confirmed', 0)}** confirmed")
        lines.append(f"- **{stats.get('pending', 0)}** pending")
        lines.append(f"- **{stats.get('cancelled', 0)}** cancelled")
        lines.append(f"- **{stats.get('checked_in', 0)}** checked in")
        lines.append(f"- **{stats.get('open_issues', 0)}** open issues")
        
        if groups:
            lines.append("\n**By type:**")
            for g in groups:
                lines.append(f"  - {g.get('group_type', '?')}: {g.get('cnt', 0)} groups")
        
        lines.append(f"\n{_db_source_label()}")
        return "\n".join(lines)
    except Exception as e:
        logger.warning("Dashboard summary query failed: %s", e)
        return f"Error querying summary: {e}"


@router.post("/ask")
async def ask(req: AskRequest):
    """AI copilot — queries Lakebase for fan operations, returns contextual responses."""
    msg = req.message.lower()
    
    # Fan Group Operations — query Lakebase directly
    if any(kw in msg for kw in ["fan group", "fan ops", "supporter group", "groups are there", "all groups", "list groups", "show groups"]):
        return {"answer": _query_fan_groups()}
    
    if "pending ticket" in msg or "pending" in msg and "ticket" in msg:
        opponent = None
        for team in ["chelsea", "city", "liverpool", "tottenham", "spurs", "villa", "united"]:
            if team in msg:
                opponent = team
                break
        return {"answer": _query_pending_tickets(opponent)}
    
    if "international" in msg and ("attendance" in msg or "highest" in msg):
        return {"answer": _query_international_attendance()}
    
    if "accessibility" in msg:
        return {"answer": _query_accessibility()}
    
    if "cancellation" in msg or "cancelled" in msg or "cancel" in msg:
        return {"answer": _query_cancellations()}
    
    if "not checked in" in msg or "check-in" in msg or "checkin" in msg or "haven't checked" in msg:
        return {"answer": _query_not_checked_in()}
    
    if "matchday support" in msg or "support before" in msg or "open issue" in msg or "need support" in msg:
        return {"answer": _query_matchday_support()}
    
    if "summary" in msg or "overview" in msg or "dashboard" in msg:
        return {"answer": _query_dashboard_summary()}
    
    # General football intelligence (non-Lakebase)
    if "saka" in msg:
        return {"answer": "**Bukayo Saka** is Arsenal's star winger — 14 goals and 11 assists this season. He's the most marketable player in the squad with global brand appeal and consistent match-winning performances."}
    if "transfer" in msg:
        return {"answer": "**Priority transfer targets:**\n\n- **Alexander Isak** (ST, £85M) — Elite finisher, perfect Arteta profile\n- **Florian Wirtz** (CAM, £110M) — Generational creative talent\n- **Josko Gvardiol** (CB, £70M) — Ball-playing defender for rotation\n- **Moisés Caicedo** (CDM, £95M) — Elite #6 to complement Rice"}
    if "fixture" in msg or "next match" in msg:
        return {"answer": "**Next fixture:** PSG vs Arsenal\n\n📅 Saturday 30 May 2026, 16:00 BST\n🏟️ Puskas Arena, Budapest\n🏆 UEFA Champions League Final\n\nThe biggest match in Arsenal's modern history."}
    if "revenue" in msg:
        return {"answer": "**Revenue projections for upcoming home fixtures:**\n\n| Fixture | Revenue |\n|---------|--------|\n| vs Man City | £4.8M |\n| vs Chelsea | £4.5M |\n| vs Aston Villa | £3.8M |\n\nTotal projected: £13.1M across next 3 home games."}
    if "lakebase" in msg or "database" in msg:
        return {"answer": _query_dashboard_summary()}
    
    # Default — try to detect fan ops keywords loosely
    fan_keywords = ["group", "ticket", "fan", "allocation", "gate", "stand", "block", "seat", "checkin", "issue"]
    if any(kw in msg for kw in fan_keywords):
        return {"answer": _query_dashboard_summary()}
    
    return {"answer": f"I can help with Arsenal FC intelligence. Ask me about:\n\n**Fan Group Operations (Lakebase):**\n- \"What fan groups are there?\"\n- \"Which groups have pending tickets?\"\n- \"International group attendance\"\n- \"Accessibility requests\"\n- \"Cancellation rates\"\n- \"Who hasn't checked in?\"\n- \"Matchday support issues\"\n\n**Football Intelligence:**\n- Players, fixtures, transfers, revenue\n\n{_db_source_label()}"}
