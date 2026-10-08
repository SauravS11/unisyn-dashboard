CREATE OR REPLACE FUNCTION public.delete_funding_application(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.application_access_tokens WHERE application_id = p_application_id;
  DELETE FROM public.application_activity WHERE application_id = p_application_id;
  DELETE FROM public.application_clarifications WHERE application_id = p_application_id;
  DELETE FROM public.application_documents WHERE application_id = p_application_id;
  DELETE FROM public.application_responses WHERE application_id = p_application_id;
  DELETE FROM public.application_sections WHERE application_id = p_application_id;
  DELETE FROM public.applications WHERE id = p_application_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_funding_application(uuid) TO authenticated;

CREATE POLICY "Authenticated users can delete applications"
ON public.applications
FOR DELETE
TO authenticated
USING (true);