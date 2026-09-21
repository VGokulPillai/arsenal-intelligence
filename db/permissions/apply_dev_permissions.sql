-- =============================================================================
-- DEVELOPMENT Branch RBAC Permissions for Arsenal FC Intelligence Platform
-- =============================================================================
-- Run this script AFTER the production → development branch reset so that
-- developer roles regain the write access they need for local iteration.
--
-- This script is IDEMPOTENT — safe to run repeatedly without side effects.
--
-- Schemas governed:
--   - arsenal_fan_ops
--   - coaching
--   - scouting
--
-- Roles configured:
--   • App service principal (current_user) — full DML (mirrors production)
--   • Developer group role              — full DML + sequence mutations
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure schemas exist (they should after reset, but be defensive)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS arsenal_fan_ops;
CREATE SCHEMA IF NOT EXISTS coaching;
CREATE SCHEMA IF NOT EXISTS scouting;

-- ---------------------------------------------------------------------------
-- 2. Configure roles via DO block so the dev role name is parameterized
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    app_role TEXT := current_user;
    dev_role TEXT := 'arsenal_dev_team';   -- change to match your dev group role
    schemas  TEXT[] := ARRAY['arsenal_fan_ops', 'coaching', 'scouting'];
    s        TEXT;
BEGIN
    -- -----------------------------------------------------------------
    -- 2a. App service principal — identical to production grants
    -- -----------------------------------------------------------------
    FOREACH s IN ARRAY schemas
    LOOP
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', s, app_role);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', s, app_role);
        EXECUTE format('GRANT USAGE ON ALL SEQUENCES IN SCHEMA %I TO %I', s, app_role);

        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
            s, app_role
        );
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE ON SEQUENCES TO %I',
            s, app_role
        );
    END LOOP;

    -- -----------------------------------------------------------------
    -- 2b. Developer group role — full DML + sequence mutation access
    -- -----------------------------------------------------------------
    FOREACH s IN ARRAY schemas
    LOOP
        -- Schema-level USAGE
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', s, dev_role);

        -- Full DML on all existing tables
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', s, dev_role);

        -- Full sequence access (USAGE for nextval, SELECT for currval, UPDATE for setval)
        EXECUTE format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA %I TO %I', s, dev_role);

        -- Future tables automatically get DML grants for developers
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
            s, dev_role
        );

        -- Future sequences automatically get full access for developers
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
            s, dev_role
        );
    END LOOP;
END
$$;
