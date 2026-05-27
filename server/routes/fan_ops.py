"""Fan Group Matchday Operations - API endpoints."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from server.data import fan_ops_db
from server.data.fan_ops_seed import seed_data

router = APIRouter(prefix="/fan-ops", tags=["fan-ops"])


def _ensure_seeded():
    """Seed data on first request if empty."""
    if not fan_ops_db.is_seeded():
        seed_data()


@router.get("/dashboard")
async def dashboard(
    fixture_id: Optional[str] = Query(None),
    group_type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    gate: Optional[str] = Query(None),
    stand: Optional[str] = Query(None),
    issue_status: Optional[str] = Query(None),
):
    """Aggregated KPIs and filtered group list for the fan ops dashboard."""
    _ensure_seeded()
    stats = fan_ops_db.get_dashboard_stats(fixture_id, group_type, region, gate, stand, issue_status)
    groups = fan_ops_db.get_groups_summary(fixture_id, group_type, region)
    return {"stats": stats, "groups": groups}


@router.get("/fixtures")
async def list_fixtures():
    """All fixtures for dropdown selection."""
    _ensure_seeded()
    return fan_ops_db.execute_query("SELECT * FROM fan_ops_fixtures ORDER BY date DESC")


@router.get("/groups")
async def list_groups(
    group_type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
):
    """All fan groups with optional filters."""
    _ensure_seeded()
    return fan_ops_db.get_groups_summary(group_type=group_type, region=region)


@router.get("/groups/{group_id}")
async def get_group(group_id: str, fixture_id: Optional[str] = Query(None)):
    """Full detail for a single fan group."""
    _ensure_seeded()
    detail = fan_ops_db.get_group_detail(group_id, fixture_id)
    if not detail:
        return {"error": "Group not found"}
    return detail


@router.get("/groups/{group_id}/fans")
async def get_group_fans(group_id: str, fixture_id: Optional[str] = Query(None)):
    """Fans and tickets for a group."""
    _ensure_seeded()
    return fan_ops_db.get_fans_for_group(group_id, fixture_id)


@router.get("/issues")
async def list_issues(
    fixture_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    """All issues with optional filters."""
    _ensure_seeded()
    return fan_ops_db.get_issues(fixture_id, status)


class TicketStatusUpdate(BaseModel):
    status: str


@router.post("/tickets/{ticket_id}/status")
async def update_ticket(ticket_id: str, body: TicketStatusUpdate):
    """Update a ticket's status (confirmed, cancelled, pending)."""
    _ensure_seeded()
    ok = fan_ops_db.update_ticket_status(ticket_id, body.status)
    return {"success": ok, "ticket_id": ticket_id, "new_status": body.status}


class CheckinRequest(BaseModel):
    ticket_id: str
    fan_id: str
    fixture_id: str
    gate: str


@router.post("/checkin")
async def checkin(body: CheckinRequest):
    """Record a fan check-in event."""
    _ensure_seeded()
    checkin_time = datetime.utcnow().isoformat() + "Z"
    checkin_id = fan_ops_db.record_checkin(body.ticket_id, body.fan_id, body.fixture_id, body.gate, checkin_time)
    return {"success": True, "checkin_id": checkin_id, "checkin_time": checkin_time}


class IssueCreate(BaseModel):
    fan_group_id: str
    fixture_id: str
    issue_type: str
    description: str


@router.post("/issues")
async def create_issue(body: IssueCreate):
    """Create a new group issue."""
    _ensure_seeded()
    created_at = datetime.utcnow().isoformat() + "Z"
    issue_id = fan_ops_db.create_issue(body.fan_group_id, body.fixture_id, body.issue_type, body.description, created_at)
    return {"success": True, "issue_id": issue_id}


class IssueUpdate(BaseModel):
    status: str


@router.patch("/issues/{issue_id}")
async def update_issue(issue_id: str, body: IssueUpdate):
    """Resolve or update an issue."""
    _ensure_seeded()
    resolved_at = datetime.utcnow().isoformat() + "Z" if body.status == "resolved" else None
    ok = fan_ops_db.update_issue(issue_id, body.status, resolved_at)
    return {"success": ok, "issue_id": issue_id, "new_status": body.status}


class NoteCreate(BaseModel):
    entity_type: str
    entity_id: str
    fixture_id: Optional[str] = None
    note: str
    author: str = "ops_staff"


@router.post("/notes")
async def create_note(body: NoteCreate):
    """Add an operational note."""
    _ensure_seeded()
    created_at = datetime.utcnow().isoformat() + "Z"
    note_id = fan_ops_db.add_note(body.entity_type, body.entity_id, body.fixture_id, body.note, body.author, created_at)
    return {"success": True, "note_id": note_id}


@router.get("/notes")
async def list_notes(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
):
    """Get operational notes."""
    _ensure_seeded()
    return fan_ops_db.get_notes(entity_type, entity_id)
