-- Allow external users with passcode to upload documents
CREATE POLICY "Anyone can create documents for deals with passcode"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.id = deal_documents.deal_id 
    AND deals.passcode IS NOT NULL
  )
);

-- Allow external users to upload files to deal-documents bucket
CREATE POLICY "Anyone can upload files for deals with passcode"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' 
  AND EXISTS (
    SELECT 1
    FROM deals
    WHERE deals.passcode IS NOT NULL
    AND deals.id::text = split_part(name, '/', 1)
  )
);