-- Create storage bucket for deal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-documents', 'deal-documents', false);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload deal documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'deal-documents');

-- Allow authenticated users to view their uploaded files
CREATE POLICY "Users can view deal documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'deal-documents');

-- Allow authenticated users to delete their uploaded files
CREATE POLICY "Users can delete deal documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'deal-documents');