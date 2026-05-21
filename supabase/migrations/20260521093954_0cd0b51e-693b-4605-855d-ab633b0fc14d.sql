
-- 1. Overview RPC: intake + selected categories with counts
CREATE OR REPLACE FUNCTION public.get_intake_overview(p_intake_id uuid, p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_intake public.client_intakes%ROWTYPE;
  v_cats jsonb;
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;

  SELECT * INTO v_intake FROM public.client_intakes WHERE id = p_intake_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'category_id', cat.id,
    'category_code', cat.category_code,
    'category_name', cat.category_name,
    'display_order', cat.display_order,
    'status', cic.status,
    'advisor_notes', cic.advisor_notes,
    'part1_total', COALESCE(r.p1_total, 0),
    'part1_done', COALESCE(resp.p1_done, 0),
    'part2_total', COALESCE(r.p2_total, 0),
    'part2_done', COALESCE(docs.p2_done, 0)
  ) ORDER BY cat.display_order), '[]'::jsonb)
  INTO v_cats
  FROM public.client_intake_categories cic
  JOIN public.due_diligence_categories cat ON cat.id = cic.category_id
  LEFT JOIN (
    SELECT category_id,
      COUNT(*) FILTER (WHERE input_type IN ('written_response','yes_no','applicable_na')) AS p1_total,
      COUNT(*) FILTER (WHERE input_type IN ('document_upload','document_upload_with_comment')) AS p2_total
    FROM public.due_diligence_requirements WHERE is_active = true GROUP BY category_id
  ) r ON r.category_id = cat.id
  LEFT JOIN (
    SELECT category_id, COUNT(DISTINCT requirement_id) AS p1_done
    FROM public.client_requirement_responses
    WHERE client_intake_id = p_intake_id GROUP BY category_id
  ) resp ON resp.category_id = cat.id
  LEFT JOIN (
    SELECT category_id, COUNT(DISTINCT requirement_id) AS p2_done
    FROM public.client_requirement_documents
    WHERE client_intake_id = p_intake_id GROUP BY category_id
  ) docs ON docs.category_id = cat.id
  WHERE cic.client_intake_id = p_intake_id;

  RETURN jsonb_build_object(
    'intake', jsonb_build_object(
      'id', v_intake.id,
      'intake_code', v_intake.intake_code,
      'company_name', v_intake.company_name,
      'due_date', v_intake.due_date,
      'status', v_intake.status,
      'primary_contact_name', v_intake.primary_contact_name,
      'primary_contact_email', v_intake.primary_contact_email
    ),
    'categories', v_cats
  );
END;
$$;

-- 2. Category detail RPC: requirements + existing responses/documents
CREATE OR REPLACE FUNCTION public.get_intake_category_detail(p_intake_id uuid, p_token text, p_category_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
    'file_url', file_url, 'upload_comment', upload_comment, 'uploaded_at', uploaded_at
  )), '[]'::jsonb)
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
$$;

-- 3. Submit category (respondent-side update)
CREATE OR REPLACE FUNCTION public.submit_intake_category(p_intake_id uuid, p_token text, p_category_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  UPDATE public.client_intake_categories
  SET status = 'submitted', updated_at = now()
  WHERE client_intake_id = p_intake_id AND category_id = p_category_id;

  INSERT INTO public.intake_activity_log (client_intake_id, activity_type, description, actor_type)
  VALUES (p_intake_id, 'category_submitted', 'Respondent submitted a category', 'respondent');

  RETURN true;
END;
$$;

-- 4. Storage policies so respondents can upload/read documents in intake-documents
DROP POLICY IF EXISTS "Anyone can upload intake documents" ON storage.objects;
CREATE POLICY "Anyone can upload intake documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'intake-documents');

DROP POLICY IF EXISTS "Anyone can read intake documents" ON storage.objects;
CREATE POLICY "Anyone can read intake documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'intake-documents');
