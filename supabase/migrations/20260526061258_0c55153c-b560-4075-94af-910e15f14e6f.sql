
ALTER TABLE public.client_requirement_documents
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS replaces_document_id uuid;

-- Update get_intake_category_detail to include status, rejection_reason, version
CREATE OR REPLACE FUNCTION public.get_intake_category_detail(p_intake_id uuid, p_token text, p_category_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_cat public.due_diligence_categories%ROWTYPE;
  v_reqs jsonb;
  v_resps jsonb;
  v_docs jsonb;
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;

  SELECT * INTO v_cat FROM public.due_diligence_categories WHERE category_code = p_category_code;
  IF v_cat.id IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'requirement_code', requirement_code, 'requirement_text', requirement_text,
    'input_type', input_type, 'is_required', is_required, 'help_text', help_text,
    'display_order', display_order
  ) ORDER BY display_order), '[]'::jsonb)
  INTO v_reqs
  FROM public.due_diligence_requirements
  WHERE category_id = v_cat.id AND is_active = true;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'requirement_id', requirement_id, 'response_value', response_value,
    'yes_no_value', yes_no_value, 'applicable_status', applicable_status,
    'comment', comment, 'status', status
  )), '[]'::jsonb)
  INTO v_resps
  FROM public.client_requirement_responses
  WHERE client_intake_id = p_intake_id AND category_id = v_cat.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'requirement_id', requirement_id, 'file_name', file_name,
    'file_url', file_url, 'upload_comment', upload_comment, 'uploaded_at', uploaded_at,
    'status', status, 'rejection_reason', rejection_reason, 'version', version,
    'replaces_document_id', replaces_document_id
  ) ORDER BY uploaded_at DESC), '[]'::jsonb)
  INTO v_docs
  FROM public.client_requirement_documents
  WHERE client_intake_id = p_intake_id AND category_id = v_cat.id;

  RETURN jsonb_build_object(
    'category', jsonb_build_object(
      'id', v_cat.id, 'category_code', v_cat.category_code,
      'category_name', v_cat.category_name, 'description', v_cat.description
    ),
    'requirements', v_reqs,
    'responses', v_resps,
    'documents', v_docs
  );
END;
$function$;

-- Update register_intake_document to support versioning + replaces_document_id
CREATE OR REPLACE FUNCTION public.register_intake_document(
  p_intake_id uuid, p_token text, p_requirement_id uuid,
  p_file_name text, p_file_url text, p_file_type text, p_file_size bigint,
  p_upload_comment text, p_uploaded_by_email text,
  p_replaces_document_id uuid DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_category_id uuid;
  v_id uuid;
  v_version integer;
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT category_id INTO v_category_id FROM public.due_diligence_requirements WHERE id = p_requirement_id;

  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
  FROM public.client_requirement_documents
  WHERE client_intake_id = p_intake_id AND requirement_id = p_requirement_id;

  INSERT INTO public.client_requirement_documents
    (client_intake_id, category_id, requirement_id, file_name, file_url, file_type, file_size,
     upload_comment, uploaded_by_email, status, version, replaces_document_id)
  VALUES (p_intake_id, v_category_id, p_requirement_id, p_file_name, p_file_url, p_file_type, p_file_size,
          p_upload_comment, p_uploaded_by_email, 'uploaded', v_version, p_replaces_document_id)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;
