-- Create security definer function to check if deal has passcode
CREATE OR REPLACE FUNCTION public.deal_has_passcode(deal_id_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deals
    WHERE id::text = deal_id_text
    AND passcode IS NOT NULL
  );
$$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can upload files for deals with passcode" ON storage.objects;

-- Create new policy using the security definer function
CREATE POLICY "Anyone can upload files for deals with passcode"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deal-documents' 
  AND public.deal_has_passcode(split_part(name, '/', 1))
);