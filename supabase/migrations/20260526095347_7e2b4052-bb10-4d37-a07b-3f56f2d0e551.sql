
CREATE TABLE public.intake_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_intake_id UUID NOT NULL,
  category_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_intake_id, category_id, email)
);

ALTER TABLE public.intake_specialists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors manage intake specialists"
ON public.intake_specialists
FOR ALL
USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = intake_specialists.client_intake_id AND ci.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = intake_specialists.client_intake_id AND ci.created_by = auth.uid()));

CREATE TRIGGER update_intake_specialists_updated_at
BEFORE UPDATE ON public.intake_specialists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update seed_deal_from_intake to also copy specialists into deal_specialists
CREATE OR REPLACE FUNCTION public.seed_deal_from_intake(p_deal_id uuid, p_intake_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  v_cat record;
  v_req record;
  v_doc record;
  v_spec record;
  v_dc_id uuid;
  v_task_order int;
  v_has_response boolean;
  v_has_doc boolean;
  v_doc_approved boolean;
  v_cats_inserted int := 0;
  v_tasks_inserted int := 0;
  v_docs_inserted int := 0;
  v_specs_inserted int := 0;
BEGIN
  SELECT user_id INTO v_user FROM public.deals WHERE id = p_deal_id;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> v_user THEN
    RAISE EXCEPTION 'Not authorized to seed this deal';
  END IF;

  FOR v_cat IN
    SELECT cic.category_id, dc.category_code, dc.category_name, dc.display_order
    FROM public.client_intake_categories cic
    JOIN public.due_diligence_categories dc ON dc.id = cic.category_id
    WHERE cic.client_intake_id = p_intake_id
    ORDER BY dc.display_order
  LOOP
    SELECT id INTO v_dc_id FROM public.deal_categories
      WHERE deal_id = p_deal_id AND category_code = v_cat.category_code
      LIMIT 1;
    IF v_dc_id IS NULL THEN
      INSERT INTO public.deal_categories (deal_id, category_code, title, category_order)
      VALUES (p_deal_id, v_cat.category_code, v_cat.category_name, v_cat.display_order)
      RETURNING id INTO v_dc_id;
      v_cats_inserted := v_cats_inserted + 1;
    END IF;

    v_task_order := 0;
    FOR v_req IN
      SELECT id, requirement_code, requirement_text, input_type, display_order
      FROM public.due_diligence_requirements
      WHERE category_id = v_cat.category_id AND is_active = true
      ORDER BY display_order
    LOOP
      v_task_order := v_task_order + 1;

      SELECT EXISTS(SELECT 1 FROM public.client_requirement_responses
        WHERE client_intake_id = p_intake_id AND requirement_id = v_req.id) INTO v_has_response;
      SELECT EXISTS(SELECT 1 FROM public.client_requirement_documents
        WHERE client_intake_id = p_intake_id AND requirement_id = v_req.id) INTO v_has_doc;
      SELECT EXISTS(SELECT 1 FROM public.client_requirement_documents
        WHERE client_intake_id = p_intake_id AND requirement_id = v_req.id AND status = 'approved') INTO v_doc_approved;

      IF NOT EXISTS (SELECT 1 FROM public.deal_tasks WHERE category_id = v_dc_id AND task_code = v_req.requirement_code) THEN
        INSERT INTO public.deal_tasks
          (category_id, task_code, title, priority, status, checked, has_attachment, task_order)
        VALUES (
          v_dc_id, v_req.requirement_code, v_req.requirement_text, 'medium',
          CASE WHEN v_doc_approved OR (v_has_response AND v_req.input_type IN ('written_response','yes_no','applicable_na'))
               THEN 'completed' ELSE 'pending' END,
          v_doc_approved OR (v_has_response AND v_req.input_type IN ('written_response','yes_no','applicable_na')),
          v_has_doc, v_task_order
        );
        v_tasks_inserted := v_tasks_inserted + 1;
      END IF;
    END LOOP;

    FOR v_doc IN
      SELECT crd.id, crd.file_name, crd.file_url, crd.file_type, crd.file_size, crd.upload_comment, crd.uploaded_by_email
      FROM public.client_requirement_documents crd
      WHERE crd.client_intake_id = p_intake_id AND crd.category_id = v_cat.category_id
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.deal_documents
        WHERE deal_id = p_deal_id AND file_path = v_doc.file_url) THEN
        INSERT INTO public.deal_documents
          (deal_id, file_name, file_path, file_size, file_type, category, notes, uploaded_by)
        VALUES (
          p_deal_id, v_doc.file_name, v_doc.file_url, v_doc.file_size, v_doc.file_type,
          v_cat.category_code || ' - ' || v_cat.category_name,
          COALESCE(v_doc.upload_comment, 'Imported from intake') ||
            CASE WHEN v_doc.uploaded_by_email IS NOT NULL THEN ' (by ' || v_doc.uploaded_by_email || ')' ELSE '' END,
          v_user
        );
        v_docs_inserted := v_docs_inserted + 1;
      END IF;
    END LOOP;

    -- Copy specialists assigned during intake into deal_specialists
    FOR v_spec IN
      SELECT name, email, role
      FROM public.intake_specialists
      WHERE client_intake_id = p_intake_id AND category_id = v_cat.category_id
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.deal_specialists
        WHERE deal_id = p_deal_id AND category_id = v_dc_id AND email = v_spec.email
      ) THEN
        INSERT INTO public.deal_specialists (deal_id, category_id, name, email, role)
        VALUES (p_deal_id, v_dc_id, v_spec.name, v_spec.email, COALESCE(v_spec.role, ''));
        v_specs_inserted := v_specs_inserted + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'categories_inserted', v_cats_inserted,
    'tasks_inserted', v_tasks_inserted,
    'documents_inserted', v_docs_inserted,
    'specialists_inserted', v_specs_inserted
  );
END;
$function$;
