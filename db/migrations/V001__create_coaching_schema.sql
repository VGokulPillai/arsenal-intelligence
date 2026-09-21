-- =============================================================================
-- V001: Create coaching schema and initial tables
-- =============================================================================
-- Tracks training sessions and per-player feedback for the coaching staff.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS coaching;

CREATE TABLE IF NOT EXISTS coaching.sessions (
    session_id          SERIAL PRIMARY KEY,
    session_date        DATE NOT NULL,
    session_type        TEXT NOT NULL,
    coach               TEXT NOT NULL,
    squad_group         TEXT,
    duration_minutes    INTEGER,
    intensity           TEXT CHECK (intensity IN ('low', 'medium', 'high', 'recovery')),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coaching.player_feedback (
    feedback_id             SERIAL PRIMARY KEY,
    session_id              INTEGER REFERENCES coaching.sessions(session_id),
    player_name             TEXT NOT NULL,
    performance_rating      INTEGER CHECK (performance_rating BETWEEN 1 AND 10),
    fitness_score           NUMERIC(4,1),
    tactical_notes          TEXT,
    areas_for_improvement   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
