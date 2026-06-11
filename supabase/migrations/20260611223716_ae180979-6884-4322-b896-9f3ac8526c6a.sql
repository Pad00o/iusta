-- Hide password_hash from public reads on shared_reports
REVOKE SELECT ON public.shared_reports FROM anon, authenticated;
GRANT SELECT (id, case_id, token, expires_at, view_count, created_at) ON public.shared_reports TO anon, authenticated;
GRANT ALL ON public.shared_reports TO service_role;

-- Ensure anonymous UPDATE can only touch view_count
REVOKE UPDATE ON public.shared_reports FROM anon, authenticated;
GRANT UPDATE (view_count) ON public.shared_reports TO anon, authenticated;