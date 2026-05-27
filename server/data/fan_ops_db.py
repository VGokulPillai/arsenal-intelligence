"""Fan Group Matchday Operations - Database layer.

Dual-mode: connects to Lakebase (PostgreSQL) when PGHOST is set,
otherwise falls back to in-memory SQLite for offline demo.
Uses Databricks SDK OAuth token rotation for Lakebase auth.
"""
import os
import sqlite3
import threading
import logging
from typing import Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

try:
    import psycopg2
    import psycopg2.extras
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False

try:
    from databricks.sdk import WorkspaceClient
    HAS_SDK = True
except ImportError:
    HAS_SDK = False

LAKEBASE_URL = os.environ.get("LAKEBASE_URL", "") or os.environ.get("DB_CONNECTION_STRING", "")

# Databricks Apps injects these env vars when Lakebase resource is attached
PG_HOST = os.environ.get("PGHOST", "")
PG_DATABASE = os.environ.get("PGDATABASE", "")
PG_USER = os.environ.get("PGUSER", "")
PG_PASSWORD = os.environ.get("PGPASSWORD", "")
PG_PORT = os.environ.get("PGPORT", "5432")

def _use_postgres() -> bool:
    """Determine if we should use real PostgreSQL (Lakebase)."""
    if not HAS_PSYCOPG2:
        logger.info("psycopg2 not available, using SQLite")
        return False
    if LAKEBASE_URL:
        logger.info("Using Lakebase via connection string")
        return True
    if PG_HOST and PG_DATABASE:
        logger.info("Using Lakebase via PGHOST=%s, PGDATABASE=%s", PG_HOST, PG_DATABASE)
        return True
    logger.info("No Lakebase config found (PGHOST=%r, DB_CONN=%r), using SQLite", PG_HOST, bool(LAKEBASE_URL))
    return False

_sqlite_lock = threading.Lock()
_sqlite_conn: sqlite3.Connection | None = None
_initialized = False
_pg_failed = False

SCHEMA_SQL = """
CREATE SCHEMA IF NOT EXISTS arsenal_fan_ops;

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_fixtures (
    match_id TEXT PRIMARY KEY,
    opponent TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    competition TEXT NOT NULL DEFAULT 'Premier League',
    kickoff TEXT NOT NULL DEFAULT '15:00',
    is_home INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_groups (
    group_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    group_type TEXT NOT NULL,
    primary_contact TEXT,
    contact_email TEXT,
    member_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_fans (
    fan_id TEXT PRIMARY KEY,
    fan_group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    membership_id TEXT,
    accessibility_needs TEXT,
    FOREIGN KEY (fan_group_id) REFERENCES arsenal_fan_ops.fan_ops_groups(group_id)
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_ticket_allocations (
    ticket_id TEXT PRIMARY KEY,
    fan_id TEXT NOT NULL,
    fan_group_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    seat_block TEXT,
    row TEXT,
    seat TEXT,
    ticket_status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    gate TEXT,
    stand TEXT,
    FOREIGN KEY (fan_id) REFERENCES arsenal_fan_ops.fan_ops_fans(fan_id),
    FOREIGN KEY (fan_group_id) REFERENCES arsenal_fan_ops.fan_ops_groups(group_id),
    FOREIGN KEY (fixture_id) REFERENCES arsenal_fan_ops.fan_ops_fixtures(match_id)
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_checkin_events (
    checkin_id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    fan_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    checked_in INTEGER NOT NULL DEFAULT 0,
    checkin_time TEXT,
    gate TEXT,
    FOREIGN KEY (ticket_id) REFERENCES arsenal_fan_ops.fan_ops_ticket_allocations(ticket_id)
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_group_issues (
    issue_id TEXT PRIMARY KEY,
    fan_group_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY (fan_group_id) REFERENCES arsenal_fan_ops.fan_ops_groups(group_id),
    FOREIGN KEY (fixture_id) REFERENCES arsenal_fan_ops.fan_ops_fixtures(match_id)
);

CREATE TABLE IF NOT EXISTS arsenal_fan_ops.fan_ops_operational_notes (
    note_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    fixture_id TEXT,
    note TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'ops_staff',
    created_at TEXT NOT NULL
);
"""

SCHEMA_SQL_SQLITE = """
CREATE TABLE IF NOT EXISTS fan_ops_fixtures (
    match_id TEXT PRIMARY KEY,
    opponent TEXT NOT NULL,
    date TEXT NOT NULL,
    venue TEXT NOT NULL,
    competition TEXT NOT NULL DEFAULT 'Premier League',
    kickoff TEXT NOT NULL DEFAULT '15:00',
    is_home INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS fan_ops_groups (
    group_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    group_type TEXT NOT NULL,
    primary_contact TEXT,
    contact_email TEXT,
    member_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fan_ops_fans (
    fan_id TEXT PRIMARY KEY,
    fan_group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    membership_id TEXT,
    accessibility_needs TEXT,
    FOREIGN KEY (fan_group_id) REFERENCES fan_ops_groups(group_id)
);

CREATE TABLE IF NOT EXISTS fan_ops_ticket_allocations (
    ticket_id TEXT PRIMARY KEY,
    fan_id TEXT NOT NULL,
    fan_group_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    seat_block TEXT,
    row TEXT,
    seat TEXT,
    ticket_status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    gate TEXT,
    stand TEXT,
    FOREIGN KEY (fan_id) REFERENCES fan_ops_fans(fan_id),
    FOREIGN KEY (fan_group_id) REFERENCES fan_ops_groups(group_id),
    FOREIGN KEY (fixture_id) REFERENCES fan_ops_fixtures(match_id)
);

CREATE TABLE IF NOT EXISTS fan_ops_checkin_events (
    checkin_id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    fan_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    checked_in INTEGER NOT NULL DEFAULT 0,
    checkin_time TEXT,
    gate TEXT,
    FOREIGN KEY (ticket_id) REFERENCES fan_ops_ticket_allocations(ticket_id)
);

CREATE TABLE IF NOT EXISTS fan_ops_group_issues (
    issue_id TEXT PRIMARY KEY,
    fan_group_id TEXT NOT NULL,
    fixture_id TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    FOREIGN KEY (fan_group_id) REFERENCES fan_ops_groups(group_id),
    FOREIGN KEY (fixture_id) REFERENCES fan_ops_fixtures(match_id)
);

CREATE TABLE IF NOT EXISTS fan_ops_operational_notes (
    note_id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    fixture_id TEXT,
    note TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'ops_staff',
    created_at TEXT NOT NULL
);
"""


def _get_sqlite_connection() -> sqlite3.Connection:
    global _sqlite_conn
    if _sqlite_conn is None:
        _sqlite_conn = sqlite3.connect(":memory:", check_same_thread=False)
        _sqlite_conn.row_factory = sqlite3.Row
        _sqlite_conn.execute("PRAGMA journal_mode=WAL")
        _sqlite_conn.execute("PRAGMA foreign_keys=ON")
    return _sqlite_conn


def _sql(query: str) -> str:
    """Convert ?-style placeholders to %s for PostgreSQL."""
    if _use_postgres():
        return query.replace("?", "%s")
    return query


def _get_lakebase_password() -> str:
    """Get a fresh OAuth token for Lakebase authentication."""
    if PG_PASSWORD:
        return PG_PASSWORD
    if not HAS_SDK:
        logger.warning("databricks-sdk not available for token generation")
        return ""
    try:
        w = WorkspaceClient()
        endpoint_name = os.environ.get("ENDPOINT_NAME", "")
        if endpoint_name:
            credential = w.postgres.generate_database_credential(endpoint=endpoint_name)
            logger.info("Generated Lakebase credential via endpoint")
            return credential.token
        else:
            credential = w.postgres.generate_database_credential()
            logger.info("Generated Lakebase credential (no endpoint)")
            return credential.token
    except Exception as e:
        logger.warning("Lakebase credential generation failed: %s", e)
    try:
        from databricks.sdk.core import Config
        cfg = Config()
        headers = cfg.authenticate()
        token = headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            logger.info("Using workspace OAuth token as Lakebase password")
            return token
    except Exception as e:
        logger.warning("Fallback token failed: %s", e)
    return ""


@contextmanager
def get_connection():
    """Get a database connection - Lakebase (Postgres) or SQLite fallback."""
    global _initialized, _pg_failed
    if _use_postgres() and not _pg_failed:
        conn = None
        try:
            if LAKEBASE_URL:
                conn = psycopg2.connect(LAKEBASE_URL)
            else:
                password = _get_lakebase_password()
                connect_kwargs = {
                    "host": PG_HOST,
                    "database": PG_DATABASE,
                    "port": PG_PORT,
                    "sslmode": os.environ.get("PGSSLMODE", "require"),
                }
                if PG_USER:
                    connect_kwargs["user"] = PG_USER
                if password:
                    connect_kwargs["password"] = password
                conn = psycopg2.connect(**connect_kwargs)
        except Exception as e:
            logger.error("Lakebase connection failed, falling back to SQLite: %s", e)
            _pg_failed = True
            _initialized = False

        if conn is not None:
            try:
                if not LAKEBASE_URL:
                    cur = conn.cursor()
                    cur.execute("SET search_path TO arsenal_fan_ops, public;")
                    cur.close()
                yield conn
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()
            return

    with _sqlite_lock:
        conn = _get_sqlite_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise


def initialize_schema():
    """Create tables if they don't exist."""
    global _initialized
    if _initialized:
        return

    with get_connection() as conn:
        if _use_postgres() and not _pg_failed:
            cur = conn.cursor()
            cur.execute(SCHEMA_SQL)
            cur.close()
        else:
            conn.executescript(SCHEMA_SQL_SQLITE)

    _initialized = True
    logger.info("Fan ops schema initialized (mode=%s)", "lakebase" if (_use_postgres() and not _pg_failed) else "sqlite")


def is_seeded() -> bool:
    """Check if data already exists."""
    initialize_schema()
    with get_connection() as conn:
        if _use_postgres():
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM fan_ops_groups")
            count = cur.fetchone()[0]
            cur.close()
        else:
            cur = conn.execute("SELECT COUNT(*) FROM fan_ops_groups")
            count = cur.fetchone()[0]
    return count > 0


def execute_query(sql: str, params: tuple = ()) -> list[dict]:
    """Execute a SELECT query and return list of dicts."""
    initialize_schema()
    query = _sql(sql)
    with get_connection() as conn:
        if _use_postgres():
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur.execute(query, params)
            rows = cur.fetchall()
            cur.close()
            return [dict(r) for r in rows]
        else:
            cur = conn.execute(query, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]


def execute_write(sql: str, params: tuple = ()) -> int:
    """Execute an INSERT/UPDATE/DELETE and return rowcount."""
    initialize_schema()
    query = _sql(sql)
    with get_connection() as conn:
        if _use_postgres():
            cur = conn.cursor()
            cur.execute(query, params)
            rc = cur.rowcount
            cur.close()
            return rc
        else:
            cur = conn.execute(query, params)
            return cur.rowcount


def execute_many(sql: str, data: list[tuple]) -> int:
    """Execute many inserts."""
    initialize_schema()
    query = _sql(sql)
    with get_connection() as conn:
        if _use_postgres():
            cur = conn.cursor()
            psycopg2.extras.execute_batch(cur, query, data)
            rc = cur.rowcount
            cur.close()
            return rc
        else:
            conn.executemany(query, data)
            return len(data)


def get_dashboard_stats(fixture_id: str | None = None, group_type: str | None = None,
                        region: str | None = None, gate: str | None = None,
                        stand: str | None = None, issue_status: str | None = None) -> dict[str, Any]:
    """Aggregate KPIs for the fan ops dashboard."""
    initialize_schema()

    where_parts = []
    params: list = []

    if fixture_id:
        where_parts.append("ta.fixture_id = ?")
        params.append(fixture_id)
    if group_type:
        where_parts.append("g.group_type = ?")
        params.append(group_type)
    if region:
        where_parts.append("g.region = ?")
        params.append(region)
    if gate:
        where_parts.append("ta.gate = ?")
        params.append(gate)
    if stand:
        where_parts.append("ta.stand = ?")
        params.append(stand)

    where_clause = " AND ".join(where_parts) if where_parts else "1=1"

    sql = f"""
        SELECT
            COUNT(DISTINCT g.group_id) as total_groups,
            COUNT(ta.ticket_id) as total_allocated,
            SUM(CASE WHEN ta.ticket_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN ta.ticket_status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN ta.ticket_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM fan_ops_groups g
        LEFT JOIN fan_ops_ticket_allocations ta ON g.group_id = ta.fan_group_id
        WHERE {where_clause}
    """

    rows = execute_query(sql, tuple(params))
    stats = rows[0] if rows else {}

    checkin_params: list = []
    checkin_where = []
    if fixture_id:
        checkin_where.append("ce.fixture_id = ?")
        checkin_params.append(fixture_id)
    checkin_clause = " AND ".join(checkin_where) if checkin_where else "1=1"

    checkin_sql = f"""
        SELECT COUNT(*) as checked_in
        FROM fan_ops_checkin_events ce
        WHERE ce.checked_in = 1 AND {checkin_clause}
    """
    checkin_rows = execute_query(checkin_sql, tuple(checkin_params))
    checked_in = checkin_rows[0]["checked_in"] if checkin_rows else 0

    issue_params: list = []
    issue_where = []
    if fixture_id:
        issue_where.append("gi.fixture_id = ?")
        issue_params.append(fixture_id)
    if issue_status:
        issue_where.append("gi.status = ?")
        issue_params.append(issue_status)
    else:
        issue_where.append("gi.status = 'open'")
    issue_clause = " AND ".join(issue_where) if issue_where else "1=1"

    issue_sql = f"""
        SELECT COUNT(*) as open_issues
        FROM fan_ops_group_issues gi
        WHERE {issue_clause}
    """
    issue_rows = execute_query(issue_sql, tuple(issue_params))
    open_issues = issue_rows[0]["open_issues"] if issue_rows else 0

    return {
        "total_groups": stats.get("total_groups", 0),
        "total_allocated": stats.get("total_allocated", 0),
        "confirmed": stats.get("confirmed", 0),
        "pending": stats.get("pending", 0),
        "cancelled": stats.get("cancelled", 0),
        "checked_in": checked_in,
        "open_issues": open_issues,
    }


def get_groups_summary(fixture_id: str | None = None, group_type: str | None = None,
                       region: str | None = None) -> list[dict]:
    """Get fan groups with allocation summaries."""
    where_parts = []
    params: list = []

    if group_type:
        where_parts.append("g.group_type = ?")
        params.append(group_type)
    if region:
        where_parts.append("g.region = ?")
        params.append(region)

    where_clause = " AND ".join(where_parts) if where_parts else "1=1"

    fixture_filter = ""
    if fixture_id:
        fixture_filter = "AND ta.fixture_id = ?"
        params.append(fixture_id)

    sql = f"""
        SELECT
            g.group_id, g.name, g.region, g.group_type, g.primary_contact,
            g.contact_email, g.member_count,
            COUNT(ta.ticket_id) as allocated,
            SUM(CASE WHEN ta.ticket_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN ta.ticket_status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN ta.ticket_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM fan_ops_groups g
        LEFT JOIN fan_ops_ticket_allocations ta ON g.group_id = ta.fan_group_id {fixture_filter}
        WHERE {where_clause}
        GROUP BY g.group_id, g.name, g.region, g.group_type, g.primary_contact, g.contact_email, g.member_count
        ORDER BY g.name
    """
    return execute_query(sql, tuple(params))


def get_group_detail(group_id: str, fixture_id: str | None = None) -> dict | None:
    """Get full detail for a single fan group."""
    rows = execute_query("SELECT * FROM fan_ops_groups WHERE group_id = ?", (group_id,))
    if not rows:
        return None

    group = rows[0]

    fixture_filter = ""
    params: list = [group_id]
    if fixture_id:
        fixture_filter = "AND ta.fixture_id = ?"
        params.append(fixture_id)

    ticket_sql = f"""
        SELECT ta.*, f.name as fan_name, f.membership_id,
               ce.checked_in, ce.checkin_time, ce.gate as checkin_gate
        FROM fan_ops_ticket_allocations ta
        JOIN fan_ops_fans f ON ta.fan_id = f.fan_id
        LEFT JOIN fan_ops_checkin_events ce ON ta.ticket_id = ce.ticket_id
        WHERE ta.fan_group_id = ? {fixture_filter}
        ORDER BY f.name
    """
    tickets = execute_query(ticket_sql, tuple(params))

    issue_params: list = [group_id]
    issue_filter = ""
    if fixture_id:
        issue_filter = "AND fixture_id = ?"
        issue_params.append(fixture_id)

    issues = execute_query(
        f"SELECT * FROM fan_ops_group_issues WHERE fan_group_id = ? {issue_filter} ORDER BY created_at DESC",
        tuple(issue_params)
    )

    return {**group, "tickets": tickets, "issues": issues}


def get_fans_for_group(group_id: str, fixture_id: str | None = None) -> list[dict]:
    """Get fans and their ticket info for a group."""
    params: list = [group_id]
    fixture_filter = ""
    if fixture_id:
        fixture_filter = "AND ta.fixture_id = ?"
        params.append(fixture_id)

    sql = f"""
        SELECT f.fan_id, f.name, f.membership_id, f.accessibility_needs,
               ta.ticket_id, ta.seat_block, ta.row, ta.seat, ta.ticket_status,
               ta.payment_status, ta.gate, ta.stand,
               ce.checked_in, ce.checkin_time
        FROM fan_ops_fans f
        LEFT JOIN fan_ops_ticket_allocations ta ON f.fan_id = ta.fan_id {fixture_filter}
        LEFT JOIN fan_ops_checkin_events ce ON ta.ticket_id = ce.ticket_id
        WHERE f.fan_group_id = ?
        ORDER BY f.name
    """
    return execute_query(sql, tuple(params))


def update_ticket_status(ticket_id: str, status: str) -> bool:
    """Update a ticket's status."""
    rc = execute_write(
        "UPDATE fan_ops_ticket_allocations SET ticket_status = ? WHERE ticket_id = ?",
        (status, ticket_id)
    )
    return rc > 0


def record_checkin(ticket_id: str, fan_id: str, fixture_id: str, gate: str, checkin_time: str) -> str:
    """Record a check-in event."""
    import uuid
    checkin_id = f"ci-{uuid.uuid4().hex[:8]}"
    execute_write(
        "INSERT INTO fan_ops_checkin_events (checkin_id, ticket_id, fan_id, fixture_id, checked_in, checkin_time, gate) VALUES (?, ?, ?, ?, 1, ?, ?)",
        (checkin_id, ticket_id, fan_id, fixture_id, checkin_time, gate)
    )
    return checkin_id


def create_issue(fan_group_id: str, fixture_id: str, issue_type: str, description: str, created_at: str) -> str:
    """Create a new group issue."""
    import uuid
    issue_id = f"iss-{uuid.uuid4().hex[:8]}"
    execute_write(
        "INSERT INTO fan_ops_group_issues (issue_id, fan_group_id, fixture_id, issue_type, description, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?)",
        (issue_id, fan_group_id, fixture_id, issue_type, description, created_at)
    )
    return issue_id


def update_issue(issue_id: str, status: str, resolved_at: str | None = None) -> bool:
    """Update an issue status."""
    if resolved_at:
        rc = execute_write(
            "UPDATE fan_ops_group_issues SET status = ?, resolved_at = ? WHERE issue_id = ?",
            (status, resolved_at, issue_id)
        )
    else:
        rc = execute_write(
            "UPDATE fan_ops_group_issues SET status = ? WHERE issue_id = ?",
            (status, issue_id)
        )
    return rc > 0


def add_note(entity_type: str, entity_id: str, fixture_id: str | None, note: str, author: str, created_at: str) -> str:
    """Add an operational note."""
    import uuid
    note_id = f"n-{uuid.uuid4().hex[:8]}"
    execute_write(
        "INSERT INTO fan_ops_operational_notes (note_id, entity_type, entity_id, fixture_id, note, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (note_id, entity_type, entity_id, fixture_id, note, author, created_at)
    )
    return note_id


def get_notes(entity_type: str | None = None, entity_id: str | None = None) -> list[dict]:
    """Get operational notes, optionally filtered."""
    where_parts = []
    params: list = []
    if entity_type:
        where_parts.append("entity_type = ?")
        params.append(entity_type)
    if entity_id:
        where_parts.append("entity_id = ?")
        params.append(entity_id)
    where_clause = " AND ".join(where_parts) if where_parts else "1=1"
    return execute_query(f"SELECT * FROM fan_ops_operational_notes WHERE {where_clause} ORDER BY created_at DESC", tuple(params))


def get_issues(fixture_id: str | None = None, status: str | None = None) -> list[dict]:
    """Get issues with optional filters."""
    where_parts = []
    params: list = []
    if fixture_id:
        where_parts.append("gi.fixture_id = ?")
        params.append(fixture_id)
    if status:
        where_parts.append("gi.status = ?")
        params.append(status)
    where_clause = " AND ".join(where_parts) if where_parts else "1=1"
    sql = f"""
        SELECT gi.*, g.name as group_name
        FROM fan_ops_group_issues gi
        JOIN fan_ops_groups g ON gi.fan_group_id = g.group_id
        WHERE {where_clause}
        ORDER BY gi.created_at DESC
    """
    return execute_query(sql, tuple(params))
