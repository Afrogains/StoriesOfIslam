-- Least-privilege runtime roles for the hosted API/worker.
-- Apply after migrations as the migration owner (stories_app).
-- Do not grant these credentials to Expo clients.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_runtime') THEN
    CREATE ROLE stories_runtime LOGIN PASSWORD 'replace-runtime-password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stories_worker') THEN
    CREATE ROLE stories_worker LOGIN PASSWORD 'replace-worker-password';
  END IF;
END $$;

REVOKE ALL ON DATABASE stories_of_islam FROM PUBLIC;
GRANT CONNECT ON DATABASE stories_of_islam TO stories_runtime, stories_worker;
GRANT USAGE ON SCHEMA public TO stories_runtime, stories_worker;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stories_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO stories_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO stories_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO stories_runtime;

-- Worker focuses on generation/media tables; still needs catalog reads.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO stories_worker;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  generation_jobs,
  media_assets,
  story_revisions
TO stories_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO stories_worker;

REVOKE CREATE ON SCHEMA public FROM stories_runtime, stories_worker;
ALTER ROLE stories_runtime NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
ALTER ROLE stories_worker NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
