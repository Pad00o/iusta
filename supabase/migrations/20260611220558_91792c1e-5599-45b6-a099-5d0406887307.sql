DROP POLICY IF EXISTS "Anyone can create shares" ON public.shared_reports;
DROP POLICY IF EXISTS "Anyone can update view_count" ON public.shared_reports;

CREATE POLICY "Public can increment view_count"
ON public.shared_reports
FOR UPDATE
USING (true)
WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.shared_reports FROM anon, authenticated;
GRANT SELECT ON public.shared_reports TO anon, authenticated;
GRANT UPDATE (view_count) ON public.shared_reports TO anon, authenticated;
GRANT ALL ON public.shared_reports TO service_role;