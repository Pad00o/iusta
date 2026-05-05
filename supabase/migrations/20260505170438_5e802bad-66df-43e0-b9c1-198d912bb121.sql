-- Public reports bucket for Google Docs viewer integration
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access
CREATE POLICY "Public read access for reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');
