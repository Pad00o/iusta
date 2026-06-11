
-- 1. Column-level privileges on app_users: hide password_hash from anon/authenticated
REVOKE SELECT ON public.app_users FROM anon, authenticated;
GRANT SELECT (id, username, studio, pagano, logo_url, is_admin, is_authorized, created_at, updated_at)
  ON public.app_users TO anon, authenticated;
GRANT ALL ON public.app_users TO service_role;

-- 2. Switch replica identity so realtime publication can use a column list
ALTER TABLE public.app_users REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'app_users'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.app_users';
  END IF;
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users
  (id, username, studio, pagano, logo_url, is_admin, is_authorized, created_at, updated_at);

-- 3. Hash existing plaintext passwords (sha256 hex). Rows already a 64-char hex digest are skipped.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE public.app_users
SET password_hash = encode(digest(password_hash, 'sha256'), 'hex')
WHERE password_hash !~ '^[a-f0-9]{64}$';

-- 4. Remove anonymous update/delete on storage buckets
DROP POLICY IF EXISTS "case-files public update" ON storage.objects;
DROP POLICY IF EXISTS "case-files public delete" ON storage.objects;
DROP POLICY IF EXISTS "reports public update" ON storage.objects;
DROP POLICY IF EXISTS "reports public delete" ON storage.objects;
