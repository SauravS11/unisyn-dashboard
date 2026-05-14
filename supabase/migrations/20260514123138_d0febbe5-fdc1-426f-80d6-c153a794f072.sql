
CREATE OR REPLACE FUNCTION public.deal_exists(deal_id_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE id::text = deal_id_text
  );
$$;

CREATE OR REPLACE FUNCTION public.deal_exists_uuid(p_deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.deals WHERE id = p_deal_id);
$$;

DROP POLICY IF EXISTS "Anyone can upload deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view deal documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete deal documents" ON storage.objects;

CREATE POLICY "Anyone can upload deal documents"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'deal-documents' AND public.deal_exists(split_part(name, '/', 1)));

CREATE POLICY "Anyone can view deal documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'deal-documents' AND public.deal_exists(split_part(name, '/', 1)));

CREATE POLICY "Anyone can delete deal documents"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'deal-documents' AND public.deal_exists(split_part(name, '/', 1)));

DROP POLICY IF EXISTS "Anyone can create deal documents" ON public.deal_documents;
DROP POLICY IF EXISTS "Anyone can view deal documents external" ON public.deal_documents;
DROP POLICY IF EXISTS "Anyone can delete deal documents external" ON public.deal_documents;

CREATE POLICY "Anyone can create deal documents"
ON public.deal_documents FOR INSERT TO public
WITH CHECK (public.deal_exists_uuid(deal_id));

CREATE POLICY "Anyone can view deal documents external"
ON public.deal_documents FOR SELECT TO public
USING (public.deal_exists_uuid(deal_id));

CREATE POLICY "Anyone can delete deal documents external"
ON public.deal_documents FOR DELETE TO public
USING (public.deal_exists_uuid(deal_id));
