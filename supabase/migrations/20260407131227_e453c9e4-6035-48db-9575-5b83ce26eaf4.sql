
-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Nuovo caso',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  titolo_pratica TEXT DEFAULT '',
  numero_pratica TEXT DEFAULT '',
  note TEXT DEFAULT '',
  folder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Open access policies (no auth)
CREATE POLICY "Allow all access to cases" ON public.cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to folders" ON public.folders FOR ALL USING (true) WITH CHECK (true);
