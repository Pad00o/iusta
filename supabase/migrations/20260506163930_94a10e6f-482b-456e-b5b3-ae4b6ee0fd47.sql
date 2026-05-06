
-- Enum status
DO $$ BEGIN
  CREATE TYPE public.case_status AS ENUM ('bozza', 'completato', 'archiviato');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- New columns on cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS uploaded_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_summary TEXT,
  ADD COLUMN IF NOT EXISTS status public.case_status NOT NULL DEFAULT 'bozza';

-- Analysis logs
CREATE TABLE IF NOT EXISTS public.analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID,
  model TEXT,
  mode TEXT,
  duration_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to analysis_logs" ON public.analysis_logs;
CREATE POLICY "Allow all access to analysis_logs" ON public.analysis_logs FOR ALL USING (true) WITH CHECK (true);

-- Case versions
CREATE TABLE IF NOT EXISTS public.case_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to case_versions" ON public.case_versions;
CREATE POLICY "Allow all access to case_versions" ON public.case_versions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_case_versions_case_id ON public.case_versions(case_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-files', 'case-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "case-files public read" ON storage.objects;
CREATE POLICY "case-files public read" ON storage.objects FOR SELECT USING (bucket_id = 'case-files');
DROP POLICY IF EXISTS "case-files public write" ON storage.objects;
CREATE POLICY "case-files public write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'case-files');
DROP POLICY IF EXISTS "case-files public update" ON storage.objects;
CREATE POLICY "case-files public update" ON storage.objects FOR UPDATE USING (bucket_id = 'case-files');
DROP POLICY IF EXISTS "case-files public delete" ON storage.objects;
CREATE POLICY "case-files public delete" ON storage.objects FOR DELETE USING (bucket_id = 'case-files');
