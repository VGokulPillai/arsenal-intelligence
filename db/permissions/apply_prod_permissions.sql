-- =============================================================================
-- PRODUCTION RBAC Permissions for Arsenal FC Intelligence Platform (Lakebase)
-- =============================================================================
-- This script is IDEMPOTENT — safe to run repeatedly without side effects.
--
-- Schemas governed:
--   - arsenal_fan_ops  (pre-existing, contains fan engagement tables)
--   - coaching          (created here if missing)
--   - scouting          (created here if missing)
--
-- Principles:
--   • The application service principal (current_user) gets full DML access.
--   • Human developers have NO write access to production schemas.
--   • PUBLIC role is explicitly stripped of write privileges on new schemas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ensure schemas exist
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS coaching;
CREATE SCHEMA IF NOT EXISTS scouting;

-- ---------------------------------------------------------------------------
-- 2. Grant USAGE on all application schemas to the service principal
--    (current_user is the app service principal running this script)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    app_role TEXT := current_user;
    schemas  TEXT[] := ARRAY['arsenal_fan_ops', 'coaching', 'scouting'];
    s        TEXT;
BEGIN
    FOREACH s IN ARRAY schemas
    LOOP
        -- Schema-level USAGE
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', s, app_role);

        -- DML on all existing tables
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO %I', s, app_role);

        -- Sequence access for SERIAL / GENERATED columns
        EXECUTE format('GRANT USAGE ON ALL SEQUENCES IN SCHEMA %I TO %I', s, app_role);

        -- Ensure future tables created in these schemas automatically inherit DML grants
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
            s, app_role
        );

        -- Ensure future sequences are also accessible
        EXECUTE format(
            'ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE ON SEQUENCES TO %I',
            s, app_role
        );
    END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- 3. Revoke write privileges from PUBLIC on coaching and scouting schemas
--    (arsenal_fan_ops is pre-existing; adjust separately if needed)
-- ---------------------------------------------------------------------------
-- Prevent any unauthenticated / default-role writes to new schemas.
REVOKE CREATE ON SCHEMA coaching FROM PUBLIC;
REVOKE CREATE ON SCHEMA scouting FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA coaching FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA scouting FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 4. Human developers must NOT have write access in production
--    No explicit grants are made for developer roles here.  If a developer
--    role was accidentally granted write access, uncomment and adapt below:
-- ---------------------------------------------------------------------------
-- REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA arsenal_fan_ops FROM dev_team;
-- REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA coaching         FROM dev_team;
-- REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA scouting         FROM dev_team;
