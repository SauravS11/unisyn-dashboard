
-- Increase storage bucket file size limit to 50MB
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'deal-documents';

-- ===== storage.objects policies =====
DROP POLICY IF EXISTS "Anyone can upload files for deals with passcode" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete deal documents" ON storage.objects;

CREATE POLICY "Anyone can upload deal documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'deal-documents'
  AND EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Anyone can view deal documents"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'deal-documents'
  AND EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id::text = split_part(name, '/', 1)
  )
);

CREATE POLICY "Anyone can delete deal documents"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'deal-documents'
  AND EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id::text = split_part(name, '/', 1)
  )
);

-- ===== deal_documents table policies =====
DROP POLICY IF EXISTS "Anyone can create documents for deals with passcode" ON public.deal_documents;
DROP POLICY IF EXISTS "Anyone can view deal documents external" ON public.deal_documents;
DROP POLICY IF EXISTS "Anyone can delete deal documents external" ON public.deal_documents;

CREATE POLICY "Anyone can create deal documents"
ON public.deal_documents FOR INSERT
TO public
WITH CHECK (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_documents.deal_id)
);

CREATE POLICY "Anyone can view deal documents external"
ON public.deal_documents FOR SELECT
TO public
USING (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_documents.deal_id)
);

CREATE POLICY "Anyone can delete deal documents external"
ON public.deal_documents FOR DELETE
TO public
USING (
  EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_documents.deal_id)
);
