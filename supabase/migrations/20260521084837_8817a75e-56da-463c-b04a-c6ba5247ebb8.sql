
INSERT INTO storage.buckets (id, name, public)
VALUES ('intake-documents', 'intake-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone may upload to this bucket; the edge function validates token before calling storage
CREATE POLICY "Anyone can upload intake documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'intake-documents');

-- Only the advisor who owns the parent intake can read.
-- We encode the intake_id as the first folder, e.g. <intake_id>/<requirement_id>/<filename>
CREATE POLICY "Advisors read their intake documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'intake-documents'
  AND EXISTS (
    SELECT 1 FROM public.client_intakes ci
    WHERE ci.id::text = (storage.foldername(name))[1]
      AND ci.created_by = auth.uid()
  )
);

CREATE POLICY "Advisors delete their intake documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'intake-documents'
  AND EXISTS (
    SELECT 1 FROM public.client_intakes ci
    WHERE ci.id::text = (storage.foldername(name))[1]
      AND ci.created_by = auth.uid()
  )
);

-- Public can read using signed URLs only (edge function returns these to respondents)
