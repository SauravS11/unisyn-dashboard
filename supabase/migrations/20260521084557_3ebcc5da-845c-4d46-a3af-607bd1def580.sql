
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.intake_status AS ENUM (
  'draft','request_sent','awaiting_response','in_progress',
  'submitted_for_review','changes_requested','approved','converted_to_deal'
);

CREATE TYPE public.intake_category_status AS ENUM (
  'not_started','in_progress','submitted','changes_requested','approved'
);

CREATE TYPE public.requirement_status AS ENUM (
  'not_started','in_progress','completed','submitted','changes_requested','approved'
);

CREATE TYPE public.intake_document_status AS ENUM (
  'missing','uploaded','changes_requested','approved','rejected'
);

CREATE TYPE public.requirement_input_type AS ENUM (
  'written_response','yes_no','applicable_na','document_upload','document_upload_with_comment'
);

CREATE TYPE public.intake_client_type AS ENUM ('seller','buyer','target');

CREATE TYPE public.advisor_comment_type AS ENUM (
  'general','clarification_request','reupload_request','approval_note','risk_note'
);

CREATE TYPE public.activity_actor_type AS ENUM ('advisor','respondent','system','mia');

-- ============================================================
-- DUE DILIGENCE CATEGORIES (new A–N — distinct from legacy dd_categories)
-- ============================================================
CREATE TABLE public.due_diligence_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code text NOT NULL UNIQUE,
  category_name text NOT NULL,
  description text,
  display_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.due_diligence_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DD categories readable by authenticated"
  ON public.due_diligence_categories FOR SELECT TO authenticated USING (true);

-- ============================================================
-- DUE DILIGENCE REQUIREMENTS
-- ============================================================
CREATE TABLE public.due_diligence_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.due_diligence_categories(id) ON DELETE CASCADE,
  requirement_code text NOT NULL,
  requirement_text text NOT NULL,
  input_type public.requirement_input_type NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL,
  help_text text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, requirement_code)
);

ALTER TABLE public.due_diligence_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DD requirements readable by authenticated"
  ON public.due_diligence_requirements FOR SELECT TO authenticated USING (true);

-- ============================================================
-- CLIENT INTAKES
-- ============================================================
CREATE TABLE public.client_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_code text NOT NULL UNIQUE,
  secure_link_token text NOT NULL UNIQUE,
  client_type public.intake_client_type NOT NULL,
  company_name text NOT NULL,
  registration_number text,
  entity_type text,
  industry text,
  sector text,
  country text,
  primary_contact_name text,
  primary_contact_role text,
  primary_contact_email text,
  primary_contact_phone text,
  advisor_notes text,
  status public.intake_status NOT NULL DEFAULT 'draft',
  due_date date,
  created_by uuid NOT NULL,
  converted_deal_id uuid,
  intake_approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_intakes_created_by ON public.client_intakes(created_by);
CREATE INDEX idx_client_intakes_status ON public.client_intakes(status);

ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors view their own intakes"
  ON public.client_intakes FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Advisors create intakes"
  ON public.client_intakes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Advisors update their own intakes"
  ON public.client_intakes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Advisors delete their own intakes"
  ON public.client_intakes FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER trg_client_intakes_updated_at
  BEFORE UPDATE ON public.client_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENT INTAKE CATEGORIES
-- ============================================================
CREATE TABLE public.client_intake_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.due_diligence_categories(id),
  advisor_notes text,
  status public.intake_category_status NOT NULL DEFAULT 'not_started',
  response_completion_percentage numeric NOT NULL DEFAULT 0,
  document_completion_percentage numeric NOT NULL DEFAULT 0,
  overall_completion_percentage numeric NOT NULL DEFAULT 0,
  advisor_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_intake_id, category_id)
);

ALTER TABLE public.client_intake_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors manage intake categories"
  ON public.client_intake_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_intake_categories.client_intake_id AND ci.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_intake_categories.client_intake_id AND ci.created_by = auth.uid()));

CREATE TRIGGER trg_intake_categories_updated_at
  BEFORE UPDATE ON public.client_intake_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENT REQUIREMENT RESPONSES (Part 1)
-- ============================================================
CREATE TABLE public.client_requirement_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.due_diligence_categories(id),
  requirement_id uuid NOT NULL REFERENCES public.due_diligence_requirements(id),
  response_value text,
  yes_no_value boolean,
  applicable_status text, -- 'applicable' | 'not_applicable'
  comment text,
  status public.requirement_status NOT NULL DEFAULT 'not_started',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_intake_id, requirement_id)
);

ALTER TABLE public.client_requirement_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors view intake responses"
  ON public.client_requirement_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_requirement_responses.client_intake_id AND ci.created_by = auth.uid()));
CREATE POLICY "Advisors update intake responses"
  ON public.client_requirement_responses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_requirement_responses.client_intake_id AND ci.created_by = auth.uid()));
-- No public INSERT/DELETE — respondent writes go through edge functions

CREATE TRIGGER trg_responses_updated_at
  BEFORE UPDATE ON public.client_requirement_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- CLIENT REQUIREMENT DOCUMENTS (Part 2)
-- ============================================================
CREATE TABLE public.client_requirement_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.due_diligence_categories(id),
  requirement_id uuid NOT NULL REFERENCES public.due_diligence_requirements(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  upload_comment text,
  uploaded_by_email text,
  status public.intake_document_status NOT NULL DEFAULT 'uploaded',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_requirement_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors view intake documents"
  ON public.client_requirement_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_requirement_documents.client_intake_id AND ci.created_by = auth.uid()));
CREATE POLICY "Advisors update intake documents"
  ON public.client_requirement_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_requirement_documents.client_intake_id AND ci.created_by = auth.uid()));
CREATE POLICY "Advisors delete intake documents"
  ON public.client_requirement_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = client_requirement_documents.client_intake_id AND ci.created_by = auth.uid()));

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.client_requirement_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ADVISOR REVIEW COMMENTS
-- ============================================================
CREATE TABLE public.advisor_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.due_diligence_categories(id),
  requirement_id uuid REFERENCES public.due_diligence_requirements(id),
  document_id uuid REFERENCES public.client_requirement_documents(id) ON DELETE SET NULL,
  comment_text text NOT NULL,
  comment_type public.advisor_comment_type NOT NULL DEFAULT 'general',
  created_by uuid NOT NULL,
  visible_to_respondent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advisor_review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors manage their comments"
  ON public.advisor_review_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = advisor_review_comments.client_intake_id AND ci.created_by = auth.uid()))
  WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- INTAKE ACTIVITY LOG
-- ============================================================
CREATE TABLE public.intake_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text,
  actor_type public.activity_actor_type NOT NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Advisors view activity log"
  ON public.intake_activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.client_intakes ci WHERE ci.id = intake_activity_log.client_intake_id AND ci.created_by = auth.uid()));
-- Inserts via edge functions or DB triggers only.

-- ============================================================
-- INTAKE ACCESS TOKENS (respondent portal)
-- ============================================================
CREATE TABLE public.intake_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_intake_id uuid NOT NULL REFERENCES public.client_intakes(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_access_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access to intake tokens"
  ON public.intake_access_tokens FOR ALL USING (false);

-- ============================================================
-- DEALS table additions
-- ============================================================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS source_intake_id uuid REFERENCES public.client_intakes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_company_name text,
  ADD COLUMN IF NOT EXISTS client_type text,
  ADD COLUMN IF NOT EXISTS intake_approved_at timestamptz;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate USYN-YYYY-NNNN intake code
CREATE OR REPLACE FUNCTION public.generate_intake_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year text := to_char(now(), 'YYYY');
  v_next int;
  v_code text;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(intake_code, '^USYN-' || v_year || '-', ''), '')::int
  ), 0) + 1
  INTO v_next
  FROM public.client_intakes
  WHERE intake_code LIKE 'USYN-' || v_year || '-%';
  v_code := 'USYN-' || v_year || '-' || lpad(v_next::text, 4, '0');
  RETURN v_code;
END;
$$;

-- Set intake_code + secure_link_token on insert
CREATE OR REPLACE FUNCTION public.set_intake_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.intake_code IS NULL OR NEW.intake_code = '' THEN
    NEW.intake_code := public.generate_intake_code();
  END IF;
  IF NEW.secure_link_token IS NULL OR NEW.secure_link_token = '' THEN
    NEW.secure_link_token := encode(gen_random_bytes(24), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_intake_defaults
  BEFORE INSERT ON public.client_intakes
  FOR EACH ROW EXECUTE FUNCTION public.set_intake_defaults();

-- Verify a 6-digit intake code (last 4 of intake_code + checksum). For simplicity,
-- we let respondents enter the FULL intake_code (e.g. USYN-2026-0001) OR the secure_link_token.
CREATE OR REPLACE FUNCTION public.verify_intake_code(
  p_code text,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, access_token text, intake_id uuid, intake_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_intake public.client_intakes%ROWTYPE;
  v_token text;
  v_hash text;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN QUERY SELECT false, 'Code is required.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO v_intake
  FROM public.client_intakes
  WHERE upper(intake_code) = upper(trim(p_code))
     OR secure_link_token = trim(p_code)
  LIMIT 1;

  IF v_intake.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid code.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF v_intake.status IN ('draft') THEN
    RETURN QUERY SELECT false, 'This request has not been sent yet.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.intake_access_tokens (client_intake_id, token_hash, ip_address, user_agent)
  VALUES (v_intake.id, v_hash, COALESCE(p_ip, 'unknown'), p_user_agent);

  -- Auto-progress status on first access
  IF v_intake.status = 'request_sent' THEN
    UPDATE public.client_intakes SET status = 'awaiting_response' WHERE id = v_intake.id;
  END IF;

  INSERT INTO public.intake_activity_log (client_intake_id, activity_type, description, actor_type)
  VALUES (v_intake.id, 'respondent_accessed', 'Respondent opened the portal', 'respondent');

  RETURN QUERY SELECT true, 'Access granted.'::text, v_token, v_intake.id, v_intake.intake_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_intake_access_token(p_intake_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
BEGIN
  v_hash := encode(digest(p_token, 'sha256'), 'hex');
  RETURN EXISTS (
    SELECT 1 FROM public.intake_access_tokens
    WHERE client_intake_id = p_intake_id
      AND token_hash = v_hash
      AND expires_at > now()
  );
END;
$$;

-- Submit a Part 1 response (called from edge function after token validation)
CREATE OR REPLACE FUNCTION public.submit_intake_response(
  p_intake_id uuid,
  p_token text,
  p_requirement_id uuid,
  p_response_value text,
  p_yes_no boolean,
  p_applicable_status text,
  p_comment text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;

  SELECT category_id INTO v_category_id FROM public.due_diligence_requirements WHERE id = p_requirement_id;

  INSERT INTO public.client_requirement_responses
    (client_intake_id, category_id, requirement_id, response_value, yes_no_value, applicable_status, comment, status)
  VALUES (p_intake_id, v_category_id, p_requirement_id, p_response_value, p_yes_no, p_applicable_status, p_comment, 'completed')
  ON CONFLICT (client_intake_id, requirement_id) DO UPDATE
    SET response_value = EXCLUDED.response_value,
        yes_no_value = EXCLUDED.yes_no_value,
        applicable_status = EXCLUDED.applicable_status,
        comment = EXCLUDED.comment,
        status = 'completed',
        updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Register an uploaded Part 2 document
CREATE OR REPLACE FUNCTION public.register_intake_document(
  p_intake_id uuid,
  p_token text,
  p_requirement_id uuid,
  p_file_name text,
  p_file_url text,
  p_file_type text,
  p_file_size bigint,
  p_upload_comment text,
  p_uploaded_by_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.validate_intake_access_token(p_intake_id, p_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT category_id INTO v_category_id FROM public.due_diligence_requirements WHERE id = p_requirement_id;

  INSERT INTO public.client_requirement_documents
    (client_intake_id, category_id, requirement_id, file_name, file_url, file_type, file_size, upload_comment, uploaded_by_email, status)
  VALUES (p_intake_id, v_category_id, p_requirement_id, p_file_name, p_file_url, p_file_type, p_file_size, p_upload_comment, p_uploaded_by_email, 'uploaded')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
INSERT INTO public.due_diligence_categories (category_code, category_name, display_order) VALUES
  ('A','Historical Financials',1),
  ('B','Business Model / Financial Projections',2),
  ('C','General Legal, Corporate and Compliance Matters',3),
  ('D','General Overview of Assets',4),
  ('E','General Overview of Borrowings / Liabilities',5),
  ('F','Material Contracts, Negotiations and Arrangements',6),
  ('G','Employees',7),
  ('H','Intellectual Property',8),
  ('I','Insurance',9),
  ('J','Compliance with Statutes and Regulations',10),
  ('K','Legal',11),
  ('L','Technology',12),
  ('M','Others',13),
  ('N','Additional Information',14);

-- ============================================================
-- SEED REQUIREMENTS
-- Helper macro: we insert per category using subqueries.
-- ============================================================

-- A
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('A5','Cash collection period','written_response',1),
  ('A8','Material adverse changes in financial position','yes_no',2),
  ('A9','Tax filings up to date','yes_no',3),
  ('A10','Significant restatements in last 3 years','yes_no',4),
  ('A-WC','Working capital trends explanation','written_response',5),
  ('A1','Audited financial statements for last 3 fiscal years','document_upload',6),
  ('A2','Monthly management reports','document_upload',7),
  ('A3','Balance sheet and cash flow','document_upload_with_comment',8),
  ('A4','Schedule of assets and liabilities','document_upload_with_comment',9),
  ('A6','Accrued payables and liabilities schedules','document_upload_with_comment',10),
  ('A7','Working capital supporting schedules','document_upload_with_comment',11)
) AS x(code, text, input, ord)
WHERE c.category_code = 'A';

-- B
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('B-FA','Forecast assumptions','written_response',1),
  ('B-RD','Revenue drivers','written_response',2),
  ('B-GA','Growth assumptions','written_response',3),
  ('B1','Excel financial model','document_upload_with_comment',4),
  ('B2','Forecast for next 4 years','document_upload_with_comment',5)
) AS x(code, text, input, ord)
WHERE c.category_code = 'B';

-- C
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('C-SUB','Subsidiary explanations','written_response',1),
  ('C-OWN','Ownership explanations','written_response',2),
  ('C-SHC','Shareholding clarifications','written_response',3),
  ('C-DIR','Director details','written_response',4),
  ('C-STR','Corporate structure notes','written_response',5),
  ('C-ENC','Encumbrance explanations','written_response',6),
  ('C1','Company structure chart','document_upload_with_comment',7),
  ('C2','Management structure chart','document_upload_with_comment',8),
  ('C3','MOI / constitutional documents','document_upload',9),
  ('C4','Incorporation certificates','document_upload',10),
  ('C5','Shareholder agreements','document_upload_with_comment',11),
  ('C6','Board minutes and resolutions','document_upload',12),
  ('C7','Tax returns','document_upload_with_comment',13),
  ('C8','Director resumes','document_upload',14)
) AS x(code, text, input, ord)
WHERE c.category_code = 'C';

-- D
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('D-PD','Property descriptions','written_response',1),
  ('D-AE','Asset explanations','written_response',2),
  ('D-OA','Operational asset notes','written_response',3),
  ('D1','Freehold/leasehold property schedules','document_upload_with_comment',4),
  ('D2','Lease agreements','document_upload',5),
  ('D3','Mortgage/security documents','document_upload_with_comment',6),
  ('D4','Equipment lease agreements','document_upload',7),
  ('D5','Material asset agreements','document_upload_with_comment',8),
  ('D6','Asset schedules','document_upload_with_comment',9)
) AS x(code, text, input, ord)
WHERE c.category_code = 'D';

-- E
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('E-EG','Existing guarantees','yes_no',1),
  ('E-OL','Outstanding liabilities','yes_no',2),
  ('E-DS','Debt exposure summary','written_response',3),
  ('E-LE','Liability explanations','written_response',4),
  ('E1','Loan agreements','document_upload',5),
  ('E2','Borrowing facilities','document_upload_with_comment',6),
  ('E3','Guarantee documents','document_upload_with_comment',7),
  ('E4','Liability schedules','document_upload_with_comment',8),
  ('E5','Debt agreements','document_upload',9)
) AS x(code, text, input, ord)
WHERE c.category_code = 'E';

-- F
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('F-CI','Contract importance explanations','written_response',1),
  ('F-NS','Negotiation summaries','written_response',2),
  ('F-SC','Supplier/customer dependency commentary','written_response',3),
  ('F1','Customer agreements','document_upload',4),
  ('F2','Supplier agreements','document_upload',5),
  ('F3','Marketing/distribution/licensing agreements','document_upload',6),
  ('F4','JV/partnership/consortium agreements','document_upload',7),
  ('F5','Material contracts','document_upload_with_comment',8),
  ('F6','Major customer schedules','document_upload_with_comment',9)
) AS x(code, text, input, ord)
WHERE c.category_code = 'F';

-- G
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('G-ET','Employee turnover explanation','written_response',1),
  ('G-CC','Compensation commentary','written_response',2),
  ('G-UN','Union participation','yes_no',3),
  ('G-KE','Key employee dependency notes','written_response',4),
  ('G1','Employee list/schedule','document_upload_with_comment',5),
  ('G2','Employment contracts','document_upload',6),
  ('G3','CVs','document_upload',7),
  ('G4','References','document_upload',8),
  ('G5','Compensation schedules','document_upload_with_comment',9),
  ('G6','HR documentation','document_upload_with_comment',10)
) AS x(code, text, input, ord)
WHERE c.category_code = 'G';

-- H
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('H-DS','IP disputes','yes_no',1),
  ('H-CD','Competitor differentiation','written_response',2),
  ('H-PA','IP protection areas','written_response',3),
  ('H-TS','Technology/IP strategy commentary','written_response',4),
  ('H1','Patent certificates','document_upload',5),
  ('H2','Trademark filings','document_upload',6),
  ('H3','Copyright records','document_upload',7),
  ('H4','IP agreements','document_upload_with_comment',8),
  ('H5','Proprietary agreements','document_upload_with_comment',9),
  ('H6','IP searches','document_upload_with_comment',10),
  ('H7','Technology documentation','document_upload_with_comment',11)
) AS x(code, text, input, ord)
WHERE c.category_code = 'H';

-- I
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('I-SC','Significant claims','yes_no',1),
  ('I-SS','Subsisting claims','yes_no',2),
  ('I-IC','Insurance requirement commentary','written_response',3),
  ('I-CE','Coverage explanations','written_response',4),
  ('I1','Insurance policies','document_upload',5),
  ('I2','Claims history','document_upload_with_comment',6),
  ('I3','Coverage documents','document_upload',7),
  ('I4','Insurance certificates','document_upload',8)
) AS x(code, text, input, ord)
WHERE c.category_code = 'I';

-- J
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('J-CC','Compliance confirmations','yes_no',1),
  ('J-RB','Regulatory breach commentary','written_response',2),
  ('J-EP','Expired permit confirmations','yes_no',3),
  ('J1','Licenses','document_upload',4),
  ('J2','Permits','document_upload',5),
  ('J3','Regulatory approvals','document_upload',6),
  ('J4','Compliance certificates','document_upload',7),
  ('J5','Government consents','document_upload',8)
) AS x(code, text, input, ord)
WHERE c.category_code = 'J';

-- K
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('K-SL','Significant litigation/claims','yes_no',1),
  ('K-CD','Consent decrees/orders','yes_no',2),
  ('K-PL','Pending litigation/judgements','yes_no',3),
  ('K-RN','Legal risk notes','written_response',4),
  ('K1','Litigation files','document_upload_with_comment',5),
  ('K2','Settlement agreements','document_upload',6),
  ('K3','Court orders','document_upload',7),
  ('K4','Legal correspondence','document_upload_with_comment',8),
  ('K5','Claims documentation','document_upload_with_comment',9)
) AS x(code, text, input, ord)
WHERE c.category_code = 'K';

-- L
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('L-TS','Tech stack explanation','written_response',1),
  ('L-PA','IP protection areas','written_response',2),
  ('L-CU','Competitor/technology uniqueness','written_response',3),
  ('L-DM','Development methodology','written_response',4),
  ('L-VP','Versioning process','written_response',5),
  ('L-IC','Infrastructure commentary','written_response',6),
  ('L1','Architecture diagrams','document_upload_with_comment',7),
  ('L2','Technical documentation','document_upload_with_comment',8),
  ('L3','Development process documents','document_upload_with_comment',9),
  ('L4','Infrastructure diagrams','document_upload_with_comment',10)
) AS x(code, text, input, ord)
WHERE c.category_code = 'L';

-- M
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('M-MA','Material adverse change','yes_no',1),
  ('M-SE','Strategic explanation','written_response',2),
  ('M-BO','Business overview notes','written_response',3),
  ('M1','Business presentation','document_upload_with_comment',4),
  ('M2','Pitch deck','document_upload',5),
  ('M3','Supporting overview documents','document_upload_with_comment',6)
) AS x(code, text, input, ord)
WHERE c.category_code = 'M';

-- N
INSERT INTO public.due_diligence_requirements (category_id, requirement_code, requirement_text, input_type, display_order)
SELECT id, x.code, x.text, x.input::public.requirement_input_type, x.ord
FROM public.due_diligence_categories c,
LATERAL (VALUES
  ('N-AC','Authorisation confirmation','yes_no',1),
  ('N-OS','Organogram/shareholding explanation','written_response',2),
  ('N-OB','Office bearers/procurement/legal advisors explanation','written_response',3),
  ('N-ED','Executive/director operational impact','yes_no',4),
  ('N-TC','Tax compliance status','yes_no',5),
  ('N1','Organograms','document_upload_with_comment',6),
  ('N2','Shareholding structure documents','document_upload_with_comment',7),
  ('N3','Governance documentation','document_upload_with_comment',8),
  ('N4','Supporting corporate documents','document_upload_with_comment',9),
  ('N5','Optional tax supporting documents','document_upload_with_comment',10)
) AS x(code, text, input, ord)
WHERE c.category_code = 'N';
