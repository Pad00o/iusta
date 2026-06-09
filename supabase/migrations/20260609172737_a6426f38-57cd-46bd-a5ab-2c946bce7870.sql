
-- Drop permissive policy
DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users;

-- Keep SELECT open (needed for login flow + realtime broadcasts); sensitive ops go through service_role edge functions
CREATE POLICY "Anyone can read app_users"
  ON public.app_users
  FOR SELECT
  USING (true);

-- Block direct INSERT/UPDATE/DELETE from anon/authenticated; only service_role bypass
CREATE POLICY "Only service role can modify app_users"
  ON public.app_users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Enable realtime
ALTER TABLE public.app_users REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
