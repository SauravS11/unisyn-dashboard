-- ============ PROFILES (workspace routing) ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  workflow_type text CHECK (workflow_type IN ('mna_deals','incubators_accelerators')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FUNDING WORKFLOW TEMPLATES ============
CREATE TABLE public.funding_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  code_prefix text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding_workflows TO anon, authenticated;
GRANT ALL ON public.funding_workflows TO service_role;
ALTER TABLE public.funding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Funding workflows are readable" ON public.funding_workflows FOR SELECT USING (true);

CREATE TABLE public.funding_workflow_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_workflow_id uuid NOT NULL REFERENCES public.funding_workflows(id) ON DELETE CASCADE,
  section_code text NOT NULL,
  section_name text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (funding_workflow_id, section_code)
);
GRANT SELECT ON public.funding_workflow_sections TO anon, authenticated;
GRANT ALL ON public.funding_workflow_sections TO service_role;
ALTER TABLE public.funding_workflow_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workflow sections are readable" ON public.funding_workflow_sections FOR SELECT USING (true);

CREATE TABLE public.funding_workflow_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.funding_workflow_sections(id) ON DELETE CASCADE,
  requirement_code text NOT NULL,
  requirement_text text NOT NULL,
  input_type text NOT NULL DEFAULT 'response' CHECK (input_type IN ('response','document','hybrid')),
  is_required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, requirement_code)
);
GRANT SELECT ON public.funding_workflow_requirements TO anon, authenticated;
GRANT ALL ON public.funding_workflow_requirements TO service_role;
ALTER TABLE public.funding_workflow_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workflow requirements are readable" ON public.funding_workflow_requirements FOR SELECT USING (true);

-- ============ APPLICATIONS ============
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code text NOT NULL UNIQUE,
  secure_link_token text NOT NULL UNIQUE,
  funding_workflow_id uuid NOT NULL REFERENCES public.funding_workflows(id),
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  applicant_type text,
  business_name text NOT NULL,
  registration_number text,
  industry text,
  business_stage text,
  country text DEFAULT 'South Africa',
  province text,
  city_region text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  website text,
  programme_notes text,
  specific_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  applicant_email text,
  due_date date,
  custom_message text,
  request_sent_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage own applications" ON public.applications FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.funding_workflow_sections(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started',
  completion_percentage numeric NOT NULL DEFAULT 0,
  manager_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, section_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_sections TO authenticated;
GRANT ALL ON public.application_sections TO service_role;
ALTER TABLE public.application_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage own application sections" ON public.application_sections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE TRIGGER trg_application_sections_updated_at BEFORE UPDATE ON public.application_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.funding_workflow_sections(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES public.funding_workflow_requirements(id) ON DELETE CASCADE,
  response_value text,
  comment text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, requirement_id)
);
GRANT SELECT, UPDATE ON public.application_responses TO authenticated;
GRANT ALL ON public.application_responses TO service_role;
ALTER TABLE public.application_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read own application responses" ON public.application_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE POLICY "Managers update own application responses" ON public.application_responses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE TRIGGER trg_application_responses_updated_at BEFORE UPDATE ON public.application_responses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.funding_workflow_sections(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES public.funding_workflow_requirements(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  upload_comment text,
  uploaded_by_email text,
  status text NOT NULL DEFAULT 'uploaded',
  rejection_reason text,
  rejected_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  replaces_document_id uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read own application documents" ON public.application_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE POLICY "Managers update own application documents" ON public.application_documents FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE TRIGGER trg_application_documents_updated_at BEFORE UPDATE ON public.application_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_clarifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.funding_workflow_sections(id) ON DELETE CASCADE,
  requirement_id uuid REFERENCES public.funding_workflow_requirements(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  requested_action text NOT NULL DEFAULT 'Update Response',
  priority text NOT NULL DEFAULT 'Medium',
  due_date date,
  status text NOT NULL DEFAULT 'open',
  applicant_response text,
  created_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_clarifications TO authenticated;
GRANT ALL ON public.application_clarifications TO service_role;
ALTER TABLE public.application_clarifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage own clarifications" ON public.application_clarifications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE TRIGGER trg_application_clarifications_updated_at BEFORE UPDATE ON public.application_clarifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.application_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  actor_type text NOT NULL DEFAULT 'system',
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.application_activity TO authenticated;
GRANT ALL ON public.application_activity TO service_role;
ALTER TABLE public.application_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read own application activity" ON public.application_activity FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));
CREATE POLICY "Managers add own application activity" ON public.application_activity FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.created_by = auth.uid()));

CREATE TABLE public.application_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.application_access_tokens TO service_role;
ALTER TABLE public.application_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct token access" ON public.application_access_tokens FOR SELECT TO authenticated USING (false);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.generate_application_code(p_prefix text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_year text := to_char(now(), 'YYYY'); v_next int; BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(application_code, '^' || p_prefix || '-' || v_year || '-', ''), '')::int), 0) + 1
  INTO v_next FROM public.applications WHERE application_code LIKE p_prefix || '-' || v_year || '-%';
  RETURN p_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.set_application_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_prefix text; BEGIN
  IF NEW.application_code IS NULL OR NEW.application_code = '' THEN
    SELECT code_prefix INTO v_prefix FROM public.funding_workflows WHERE id = NEW.funding_workflow_id;
    NEW.application_code := public.generate_application_code(COALESCE(v_prefix, 'APP'));
  END IF;
  IF NEW.secure_link_token IS NULL OR NEW.secure_link_token = '' THEN
    NEW.secure_link_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_application_defaults BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_application_defaults();

CREATE OR REPLACE FUNCTION public.seed_application_sections(p_application_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count int := 0; BEGIN
  INSERT INTO public.application_sections (application_id, section_id)
  SELECT a.id, s.id FROM public.applications a
  JOIN public.funding_workflow_sections s ON s.funding_workflow_id = a.funding_workflow_id
  WHERE a.id = p_application_id
  ON CONFLICT (application_id, section_id) DO NOTHING;
  SELECT count(*) INTO v_count FROM public.application_sections WHERE application_id = p_application_id;
  RETURN v_count;
END; $$;
GRANT EXECUTE ON FUNCTION public.seed_application_sections(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_application_token(p_application_id uuid, p_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_hash text; BEGIN
  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  RETURN EXISTS (SELECT 1 FROM public.application_access_tokens
    WHERE application_id = p_application_id AND token_hash = v_hash AND expires_at > now());
END; $$;

CREATE OR REPLACE FUNCTION public.verify_application_code(p_code text, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS TABLE(success boolean, message text, access_token text, application_id uuid, application_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_app public.applications%ROWTYPE; v_token text; v_hash text; BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN QUERY SELECT false, 'Application code is required.'::text, NULL::text, NULL::uuid, NULL::text; RETURN;
  END IF;
  SELECT a.* INTO v_app FROM public.applications a
   WHERE upper(a.application_code) = upper(trim(p_code)) OR a.secure_link_token = trim(p_code) LIMIT 1;
  IF v_app.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid application code.'::text, NULL::text, NULL::uuid, NULL::text; RETURN;
  END IF;
  IF v_app.status = 'draft' THEN
    RETURN QUERY SELECT false, 'This application request has not been sent yet.'::text, NULL::text, NULL::uuid, NULL::text; RETURN;
  END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  INSERT INTO public.application_access_tokens (application_id, token_hash, ip_address, user_agent)
  VALUES (v_app.id, v_hash, COALESCE(p_ip, 'unknown'), p_user_agent);
  IF v_app.status = 'request_sent' THEN
    UPDATE public.applications SET status = 'in_progress' WHERE id = v_app.id;
  END IF;
  INSERT INTO public.application_activity (application_id, activity_type, description, actor_type)
  VALUES (v_app.id, 'applicant_accessed', 'Applicant opened the application portal', 'applicant');
  RETURN QUERY SELECT true, 'Access granted.'::text, v_token, v_app.id, v_app.application_code;
END; $$;
GRANT EXECUTE ON FUNCTION public.verify_application_code(text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_application_overview(p_application_id uuid, p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_app public.applications%ROWTYPE; v_wf public.funding_workflows%ROWTYPE; v_sections jsonb; v_clar jsonb; BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  SELECT * INTO v_wf FROM public.funding_workflows WHERE id = v_app.funding_workflow_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'section_id', s.id, 'section_code', s.section_code, 'section_name', s.section_name,
    'sort_order', s.sort_order, 'status', COALESCE(asec.status, 'not_started'),
    'total', COALESCE(r.total, 0),
    'response_total', COALESCE(r.response_total, 0),
    'document_total', COALESCE(r.document_total, 0),
    'responses_done', COALESCE(rd.done, 0),
    'documents_done', COALESCE(dd.done, 0)
  ) ORDER BY s.sort_order), '[]'::jsonb) INTO v_sections
  FROM public.funding_workflow_sections s
  LEFT JOIN public.application_sections asec ON asec.section_id = s.id AND asec.application_id = p_application_id
  LEFT JOIN (SELECT section_id, count(*) total,
      count(*) FILTER (WHERE input_type IN ('response','hybrid')) response_total,
      count(*) FILTER (WHERE input_type IN ('document','hybrid')) document_total
    FROM public.funding_workflow_requirements GROUP BY section_id) r ON r.section_id = s.id
  LEFT JOIN (SELECT section_id, count(DISTINCT requirement_id) done FROM public.application_responses
    WHERE application_id = p_application_id GROUP BY section_id) rd ON rd.section_id = s.id
  LEFT JOIN (SELECT section_id, count(DISTINCT requirement_id) done FROM public.application_documents
    WHERE application_id = p_application_id GROUP BY section_id) dd ON dd.section_id = s.id
  WHERE s.funding_workflow_id = v_app.funding_workflow_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'section_id', section_id, 'requirement_id', requirement_id, 'title', title,
    'message', message, 'requested_action', requested_action, 'priority', priority,
    'due_date', due_date, 'status', status) ORDER BY created_at DESC), '[]'::jsonb) INTO v_clar
  FROM public.application_clarifications WHERE application_id = p_application_id AND status <> 'resolved';
  RETURN jsonb_build_object(
    'application', jsonb_build_object('id', v_app.id, 'application_code', v_app.application_code,
      'business_name', v_app.business_name, 'status', v_app.status, 'due_date', v_app.due_date,
      'contact_name', v_app.contact_name, 'contact_email', v_app.contact_email, 'updated_at', v_app.updated_at),
    'workflow', jsonb_build_object('id', v_wf.id, 'name', v_wf.name, 'slug', v_wf.slug, 'code_prefix', v_wf.code_prefix),
    'sections', v_sections, 'clarifications', v_clar);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_application_overview(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_application_section(p_application_id uuid, p_token text, p_section_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_app public.applications%ROWTYPE; v_sec public.funding_workflow_sections%ROWTYPE;
  v_reqs jsonb; v_resp jsonb; v_docs jsonb; v_clar jsonb; BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;
  SELECT * INTO v_sec FROM public.funding_workflow_sections
   WHERE funding_workflow_id = v_app.funding_workflow_id AND section_code = p_section_code;
  IF v_sec.id IS NULL THEN RAISE EXCEPTION 'Section not found'; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'requirement_code', requirement_code,
    'requirement_text', requirement_text, 'input_type', input_type, 'is_required', is_required,
    'sort_order', sort_order) ORDER BY sort_order), '[]'::jsonb) INTO v_reqs
  FROM public.funding_workflow_requirements WHERE section_id = v_sec.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('requirement_id', requirement_id,
    'response_value', response_value, 'comment', comment, 'status', status)), '[]'::jsonb) INTO v_resp
  FROM public.application_responses WHERE application_id = p_application_id AND section_id = v_sec.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'requirement_id', requirement_id,
    'file_name', file_name, 'file_url', file_url, 'upload_comment', upload_comment,
    'status', status, 'rejection_reason', rejection_reason, 'version', version,
    'replaces_document_id', replaces_document_id, 'uploaded_at', uploaded_at) ORDER BY uploaded_at DESC), '[]'::jsonb) INTO v_docs
  FROM public.application_documents WHERE application_id = p_application_id AND section_id = v_sec.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'requirement_id', requirement_id, 'title', title,
    'message', message, 'requested_action', requested_action, 'priority', priority, 'due_date', due_date,
    'status', status)), '[]'::jsonb) INTO v_clar
  FROM public.application_clarifications WHERE application_id = p_application_id
    AND (section_id = v_sec.id OR section_id IS NULL) AND status <> 'resolved';
  RETURN jsonb_build_object(
    'section', jsonb_build_object('id', v_sec.id, 'section_code', v_sec.section_code,
      'section_name', v_sec.section_name, 'sort_order', v_sec.sort_order),
    'requirements', v_reqs, 'responses', v_resp, 'documents', v_docs, 'clarifications', v_clar);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_application_section(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_application_response(p_application_id uuid, p_token text, p_requirement_id uuid, p_response_value text, p_comment text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_section_id uuid; v_id uuid; BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT section_id INTO v_section_id FROM public.funding_workflow_requirements WHERE id = p_requirement_id;
  INSERT INTO public.application_responses (application_id, section_id, requirement_id, response_value, comment, status)
  VALUES (p_application_id, v_section_id, p_requirement_id, p_response_value, p_comment, 'completed')
  ON CONFLICT (application_id, requirement_id) DO UPDATE
    SET response_value = EXCLUDED.response_value, comment = EXCLUDED.comment,
        status = 'completed', updated_at = now()
  RETURNING id INTO v_id;
  UPDATE public.application_sections SET status = CASE WHEN status IN ('not_started') THEN 'in_progress' ELSE status END,
    updated_at = now() WHERE application_id = p_application_id AND section_id = v_section_id;
  UPDATE public.applications SET updated_at = now() WHERE id = p_application_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.save_application_response(uuid, text, uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_application_document(p_application_id uuid, p_token text, p_requirement_id uuid, p_file_name text, p_file_url text, p_file_type text, p_file_size bigint, p_upload_comment text, p_uploaded_by_email text, p_replaces_document_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_section_id uuid; v_id uuid; v_version int; BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT section_id INTO v_section_id FROM public.funding_workflow_requirements WHERE id = p_requirement_id;
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version FROM public.application_documents
   WHERE application_id = p_application_id AND requirement_id = p_requirement_id;
  INSERT INTO public.application_documents (application_id, section_id, requirement_id, file_name, file_url,
    file_type, file_size, upload_comment, uploaded_by_email, status, version, replaces_document_id)
  VALUES (p_application_id, v_section_id, p_requirement_id, p_file_name, p_file_url, p_file_type, p_file_size,
    p_upload_comment, p_uploaded_by_email, 'uploaded', v_version, p_replaces_document_id)
  RETURNING id INTO v_id;
  UPDATE public.application_sections SET status = CASE WHEN status IN ('not_started') THEN 'in_progress' ELSE status END,
    updated_at = now() WHERE application_id = p_application_id AND section_id = v_section_id;
  INSERT INTO public.application_activity (application_id, activity_type, description, actor_type, actor_email)
  VALUES (p_application_id, 'document_uploaded', 'Applicant uploaded ' || p_file_name, 'applicant', p_uploaded_by_email);
  UPDATE public.applications SET updated_at = now() WHERE id = p_application_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_application_document(uuid, text, uuid, text, text, text, bigint, text, text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_application_section(p_application_id uuid, p_token text, p_section_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_name text; BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  UPDATE public.application_sections SET status = 'submitted', submitted_at = now(), updated_at = now()
   WHERE application_id = p_application_id AND section_id = p_section_id;
  SELECT section_name INTO v_name FROM public.funding_workflow_sections WHERE id = p_section_id;
  INSERT INTO public.application_activity (application_id, activity_type, description, actor_type)
  VALUES (p_application_id, 'section_submitted', 'Applicant submitted ' || COALESCE(v_name, 'a section'), 'applicant');
  UPDATE public.applications SET updated_at = now(),
    status = CASE WHEN status IN ('draft','request_sent','in_progress') THEN 'in_progress' ELSE status END
   WHERE id = p_application_id;
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_application_section(uuid, text, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_application_clarification(p_application_id uuid, p_token text, p_clarification_id uuid, p_response text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NOT public.validate_application_token(p_application_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  UPDATE public.application_clarifications
     SET status = 'submitted_for_review', applicant_response = p_response, updated_at = now()
   WHERE id = p_clarification_id AND application_id = p_application_id;
  INSERT INTO public.application_activity (application_id, activity_type, description, actor_type)
  VALUES (p_application_id, 'clarification_answered', 'Applicant submitted a clarification update', 'applicant');
  RETURN true;
END; $$;
GRANT EXECUTE ON FUNCTION public.resolve_application_clarification(uuid, text, uuid, text) TO anon, authenticated;

-- ============ SEED FUNDING WORKFLOWS AND SECTIONS ============
INSERT INTO public.funding_workflows (name, slug, code_prefix, description, sort_order) VALUES
('Business Finance','business_finance','BUSFIN','General business funding for SMEs, startups, and growth-stage businesses.',1),
('Property Finance','property_finance','PROPFIN','Funding linked to property purchase, property-backed finance, or property income.',2),
('Property Joint Venture Fund','property_joint_venture_fund','PROPJV','Funding and partnership support for property development or joint venture projects.',3),
('Asset Finance','asset_finance','ASSET','Funding for vehicles, machinery, equipment, technology, or productive business assets.',4),
('Short-Term Finance','short_term_finance','SHORT','Working capital, bridging finance, invoice finance, tender delivery, or urgent cash flow support.',5),
('Basadi-Women Growth Fund','basadi_women_growth_fund','BASADI','Growth funding for women-owned or women-led businesses.',6),
('SME Youth Jobs Fund','sme_youth_jobs_fund','YOUTH','Funding linked to youth employment, job creation, training, and SME growth.',7);

INSERT INTO public.funding_workflow_sections (funding_workflow_id, section_code, section_name, sort_order)
SELECT w.id, v.code, v.name, v.ord FROM public.funding_workflows w
JOIN (VALUES
('business_finance','A','Business Overview',1),('business_finance','B','Market & Opportunity',2),('business_finance','C','Financial Readiness',3),('business_finance','D','Team & Capability',4),('business_finance','E','Growth Plan & Use of Funds',5),('business_finance','F','Compliance & Registration',6),('business_finance','G','Supporting Documents',7),
('property_finance','A','Applicant Profile',1),('property_finance','B','Property Details',2),('property_finance','C','Ownership & Transaction Status',3),('property_finance','D','Funding Need',4),('property_finance','E','Rental / Income Position',5),('property_finance','F','Compliance & Municipal Readiness',6),('property_finance','G','Supporting Documents',7),
('property_joint_venture_fund','A','Project Overview',1),('property_joint_venture_fund','B','Development Site & Land Status',2),('property_joint_venture_fund','C','JV Partner Details',3),('property_joint_venture_fund','D','Project Feasibility',4),('property_joint_venture_fund','E','Development Approvals',5),('property_joint_venture_fund','F','Commercial Readiness',6),('property_joint_venture_fund','G','Supporting Documents',7),
('asset_finance','A','Applicant Profile',1),('asset_finance','B','Asset Details',2),('asset_finance','C','Supplier & Quote Information',3),('asset_finance','D','Funding & Repayment Profile',4),('asset_finance','E','Business Use Case',5),('asset_finance','F','Insurance & Risk',6),('asset_finance','G','Supporting Documents',7),
('short_term_finance','A','Applicant Profile',1),('short_term_finance','B','Funding Need',2),('short_term_finance','C','Repayment Source',3),('short_term_finance','D','Contract / Order / Invoice Link',4),('short_term_finance','E','Cash Flow Position',5),('short_term_finance','F','Risk & Urgency',6),('short_term_finance','G','Supporting Documents',7),
('basadi_women_growth_fund','A','Applicant Profile',1),('basadi_women_growth_fund','B','Women Ownership & Eligibility',2),('basadi_women_growth_fund','C','Business Growth Profile',3),('basadi_women_growth_fund','D','Funding Purpose',4),('basadi_women_growth_fund','E','Jobs & Impact',5),('basadi_women_growth_fund','F','Compliance Readiness',6),('basadi_women_growth_fund','G','Supporting Documents',7),
('sme_youth_jobs_fund','A','Applicant Profile',1),('sme_youth_jobs_fund','B','Employment Profile',2),('sme_youth_jobs_fund','C','Youth Job Creation Plan',3),('sme_youth_jobs_fund','D','Training & Skills Development',4),('sme_youth_jobs_fund','E','Funding Purpose',5),('sme_youth_jobs_fund','F','Payroll & Employment Evidence',6),('sme_youth_jobs_fund','G','Supporting Documents',7)
) AS v(slug, code, name, ord) ON v.slug = w.slug;

ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_clarifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_activity;