-- =============================================================================
-- V002: Create scouting schema and initial tables
-- =============================================================================
-- Tracks transfer targets and detailed scout reports for the recruitment team.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS scouting;

CREATE TABLE IF NOT EXISTS scouting.targets (
    target_id       SERIAL PRIMARY KEY,
    player_name     TEXT NOT NULL,
    current_club    TEXT,
    position        TEXT NOT NULL,
    age             INTEGER,
    nationality     TEXT,
    market_value_m  NUMERIC(6,2),
    scout_rating    INTEGER CHECK (scout_rating BETWEEN 1 AND 100),
    priority        TEXT CHECK (priority IN ('high', 'medium', 'low', 'watch')),
    status          TEXT DEFAULT 'identified'
                        CHECK (status IN ('identified', 'scouting', 'shortlisted',
                                          'negotiating', 'signed', 'rejected')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scouting.reports (
    report_id               SERIAL PRIMARY KEY,
    target_id               INTEGER REFERENCES scouting.targets(target_id),
    scout_name              TEXT NOT NULL,
    match_date              DATE,
    match_description       TEXT,
    technical_score         INTEGER CHECK (technical_score BETWEEN 1 AND 10),
    physical_score          INTEGER CHECK (physical_score BETWEEN 1 AND 10),
    tactical_score          INTEGER CHECK (tactical_score BETWEEN 1 AND 10),
    mental_score            INTEGER CHECK (mental_score BETWEEN 1 AND 10),
    overall_recommendation  TEXT,
    video_links             TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
