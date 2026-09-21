-- =============================================================================
-- UAT Branch RBAC Permissions for Arsenal FC Intelligence Platform
-- =============================================================================
-- User Acceptance Testing environment.  Testers need full DML access to
-- exercise the application end-to-end, but they must NOT receive database
-- administration privileges (CREATE ROLE, BYPASSRLS, etc.).
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
--   • UAT tester role                      — full DML, no admin privileges
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure schemas exist
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS arsenal_fan_ops;
CREATE SCHEMA IF NOT EXISTS coaching;
CREATE SCHEMA IF NOT EXISTS scouting;

-- ---------------------------------------------------------------------------
-- 2. Configure roles
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    app_role     TEXT := current_user;
    uat_role     TEXT := 'arsenal_uat_testers';   -- change to match your UAT group role
    schemas      TEXT[] := ARRAY['arsenal_fan_ops', 'coaching', 'scouting'];
    s            TEXT;
BEGIN
    -- -----------------------------------------------------------------
    -- 2a. App service principal — full read/write (same as production)
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
    -- 2b. UAT tester role — full DML for testing, NO admin privileges
    --     Testers can read/write data but cannot:
    --       • CREATE or DROP schemas / roles
    --       • ALTER system settings
    --       • BYPASS row-level security
    -- -----------------------------------------------------------------
    FOREACH s IN ARRAY schemas
    LOOP
        -- Schema-level USAGE (no CREATE — testers cannot add tables)
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', s, uat_role);

        -- Full DML on all existing tables
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', s, uat_role);

        -- Sequence access for application workflows
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO %I', s, uat_role);

        -- Future tables automatically get DML grants for UAT testers
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
            s, uat_role
        );

        -- Future sequences automatically get USAGE for UAT testers
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO %I',
            s, uat_role
        );
    END LOOP;

    -- Explicitly ensure the UAT role has no superuser-like attributes.
    -- These ALTER ROLE statements are no-ops if the flags are already unset.
    EXECUTE format('ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', uat_role);
END
$$;
