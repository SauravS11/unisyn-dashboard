-- 1. Categories reference table
CREATE TABLE public.dd_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_no  INTEGER NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expert_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id          UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES public.dd_categories(id),
  code             TEXT NOT NULL UNIQUE,
  expert_name      TEXT,
  expert_email     TEXT,
  instructions     TEXT,
  is_active        BOOLEAN DEFAULT true,
  expires_at       TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (deal_id, category_id)
);

CREATE TABLE public.expert_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.dd_categories(id),
  title        TEXT NOT NULL,
  description  TEXT,
  is_required  BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expert_task_completions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES public.expert_tasks(id) ON DELETE CASCADE,
  code_id      UUID NOT NULL REFERENCES public.expert_codes(id) ON DELETE CASCADE,
  is_complete  BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  UNIQUE (task_id, code_id)
);

CREATE TABLE public.expert_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.dd_categories(id),
  code_id         UUID NOT NULL REFERENCES public.expert_codes(id),
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type       TEXT,
  task_id         UUID REFERENCES public.expert_tasks(id),
  uploaded_at     TIMESTAMPTZ DEFAULT now(),
  notes           TEXT
);

CREATE TABLE public.expert_access_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES public.expert_codes(id),
  ip_address  TEXT,
  user_agent  TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expert_access_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES public.expert_codes(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_expert_codes_code ON public.expert_codes(code);
CREATE INDEX idx_expert_codes_deal ON public.expert_codes(deal_id);
CREATE INDEX idx_expert_tasks_deal_cat ON public.expert_tasks(deal_id, category_id);
CREATE INDEX idx_expert_docs_deal_cat ON public.expert_documents(deal_id, category_id);
CREATE INDEX idx_expert_access_tokens_hash ON public.expert_access_tokens(token_hash);
CREATE INDEX idx_expert_access_log_code ON public.expert_access_log(code_id, accessed_at DESC);

INSERT INTO public.dd_categories (category_no, name, description) VALUES
  (1,  'Corporate & Structural Integrity', 'Entity structure, governance, cap table, and corporate records'),
  (2,  'Financial Integrity & Performance', 'Historical financials, forecasts, and financial controls'),
  (3,  'Legal & Regulatory Exposure', 'Contracts, permits, regulatory filings, and compliance'),
  (4,  'Operational & Infrastructure Risk', 'Operations, supply chain, and infrastructure'),
  (5,  'Strategic & Integration Viability', 'Strategy, synergies, and integration planning'),
  (6,  'Litigation', 'Pending and threatened litigation, disputes, and settlements'),
  (7,  'IP & Ownership', 'Patents, trademarks, licenses, and IP ownership'),
  (8,  'Employment & HR', 'Employment contracts, benefits, and HR policies'),
  (9,  'Tax Compliance', 'Income tax, VAT, PAYE, and statutory tax filings'),
  (10, 'Environmental & Compliance', 'Environmental permits, ESG, and regulatory compliance'),
  (11, 'Technology & Cybersecurity', 'IT systems, data security, and cyber risk'),
  (12, 'Customer & Supplier Relationships', 'Key customers, suppliers, and concentration risk'),
  (13, 'Insurance & Liability', 'Insurance policies, claims, and liability exposure'),
  (14, 'Real Estate & Assets', 'Property, leases, equipment, and asset valuations')
ON CONFLICT (category_no) DO NOTHING;

ALTER TABLE public.dd_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dd categories"
  ON public.dd_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Deal owners manage expert codes"
  ON public.expert_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = expert_codes.deal_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = expert_codes.deal_id AND d.user_id = auth.uid()));

CREATE POLICY "Deal owners manage expert tasks"
  ON public.expert_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = expert_tasks.deal_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = expert_tasks.deal_id AND d.user_id = auth.uid()));

CREATE POLICY "Deal owners view expert completions"
  ON public.expert_task_completions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.expert_codes ec
    JOIN public.deals d ON d.id = ec.deal_id
    WHERE ec.id = expert_task_completions.code_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Deal owners view expert documents"
  ON public.expert_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = expert_documents.deal_id AND d.user_id = auth.uid()));

CREATE POLICY "Deal owners view expert access log"
  ON public.expert_access_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.expert_codes ec
    JOIN public.deals d ON d.id = ec.deal_id
    WHERE ec.id = expert_access_log.code_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "No public access to expert tokens"
  ON public.expert_access_tokens FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.generate_expert_code_segment()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_expert_access_code(p_category_no INTEGER)
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_code := public.generate_expert_code_segment() || '-CAT' || lpad(p_category_no::text, 2, '0');
    IF NOT EXISTS (SELECT 1 FROM public.expert_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique expert code';
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_expert_tasks_for_category(p_deal_id UUID, p_category_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.expert_tasks WHERE deal_id = p_deal_id AND category_id = p_category_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.expert_tasks (deal_id, category_id, title, description, sort_order) VALUES
    (p_deal_id, p_category_id, 'Review category documentation requirements', 'Confirm you have received all required document lists', 1),
    (p_deal_id, p_category_id, 'Gather and organise source materials', 'Collect all relevant files and data for this workstream', 2),
    (p_deal_id, p_category_id, 'Complete technical analysis', 'Perform your specialist review and document findings', 3),
    (p_deal_id, p_category_id, 'Upload supporting documents', 'Submit all reports, schedules, and evidence files', 4),
    (p_deal_id, p_category_id, 'Submit final deliverables', 'Upload your completed work product for this category', 5);
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_expert_codes_for_deal(p_deal_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cat RECORD;
  new_code TEXT;
  inserted_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.deals WHERE id = p_deal_id) THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.deals WHERE id = p_deal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this deal';
  END IF;
  FOR cat IN SELECT id, category_no FROM public.dd_categories ORDER BY category_no LOOP
    IF NOT EXISTS (SELECT 1 FROM public.expert_codes WHERE deal_id = p_deal_id AND category_id = cat.id) THEN
      new_code := public.generate_expert_access_code(cat.category_no);
      INSERT INTO public.expert_codes (deal_id, category_id, code) VALUES (p_deal_id, cat.id, new_code);
      inserted_count := inserted_count + 1;
    END IF;
    PERFORM public.seed_expert_tasks_for_category(p_deal_id, cat.id);
  END LOOP;
  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_expert_code(p_code_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_category_no INTEGER;
  new_code TEXT;
BEGIN
  SELECT dc.category_no INTO v_category_no
  FROM public.expert_codes ec
  JOIN public.dd_categories dc ON dc.id = ec.category_id
  WHERE ec.id = p_code_id;
  IF v_category_no IS NULL THEN
    RAISE EXCEPTION 'Expert code not found';
  END IF;
  new_code := public.generate_expert_access_code(v_category_no);
  UPDATE public.expert_codes
  SET code = new_code, is_active = true, last_accessed_at = NULL
  WHERE id = p_code_id;
  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_expert_code(
  p_code TEXT, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN, message TEXT, access_token TEXT, code_id UUID,
  deal_id UUID, category_id UUID, expert_code TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_code_row public.expert_codes%ROWTYPE;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN QUERY SELECT false, 'Access code is required.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  SELECT * INTO v_code_row FROM public.expert_codes WHERE upper(trim(code)) = upper(trim(p_code));
  IF v_code_row.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid access code.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  IF NOT v_code_row.is_active THEN
    RETURN QUERY SELECT false, 'This access code has been revoked.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  IF v_code_row.expires_at IS NOT NULL AND v_code_row.expires_at < now() THEN
    RETURN QUERY SELECT false, 'This access code has expired.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  INSERT INTO public.expert_access_tokens (code_id, token_hash, ip_address, user_agent, expires_at)
  VALUES (v_code_row.id, v_token_hash, COALESCE(p_ip_address, 'unknown'), p_user_agent, now() + interval '24 hours');
  INSERT INTO public.expert_access_log (code_id, ip_address, user_agent)
  VALUES (v_code_row.id, COALESCE(p_ip_address, 'unknown'), p_user_agent);
  UPDATE public.expert_codes SET last_accessed_at = now() WHERE id = v_code_row.id;
  RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token, v_code_row.id, v_code_row.deal_id, v_code_row.category_id, v_code_row.code;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_expert_access_token(p_code_id UUID, p_access_token TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  v_token_hash TEXT;
BEGIN
  v_token_hash := encode(digest(p_access_token, 'sha256'), 'hex');
  RETURN EXISTS (
    SELECT 1 FROM public.expert_access_tokens
    WHERE code_id = p_code_id AND token_hash = v_token_hash AND expires_at > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_expert_task_completion(
  p_code_id UUID, p_task_id UUID, p_is_complete BOOLEAN, p_access_token TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.validate_expert_access_token(p_code_id, p_access_token) THEN
    RETURN false;
  END IF;
  INSERT INTO public.expert_task_completions (task_id, code_id, is_complete, completed_at)
  VALUES (p_task_id, p_code_id, p_is_complete, CASE WHEN p_is_complete THEN now() ELSE NULL END)
  ON CONFLICT (task_id, code_id)
  DO UPDATE SET is_complete = EXCLUDED.is_complete, completed_at = EXCLUDED.completed_at;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_expert_document(
  p_code_id UUID, p_access_token TEXT, p_file_name TEXT, p_file_url TEXT,
  p_file_size_bytes INTEGER DEFAULT NULL, p_mime_type TEXT DEFAULT NULL,
  p_task_id UUID DEFAULT NULL, p_notes TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deal_id UUID;
  v_category_id UUID;
  v_doc_id UUID;
BEGIN
  IF NOT public.validate_expert_access_token(p_code_id, p_access_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT deal_id, category_id INTO v_deal_id, v_category_id FROM public.expert_codes WHERE id = p_code_id;
  INSERT INTO public.expert_documents (deal_id, category_id, code_id, file_name, file_url, file_size_bytes, mime_type, task_id, notes)
  VALUES (v_deal_id, v_category_id, p_code_id, p_file_name, p_file_url, p_file_size_bytes, p_mime_type, p_task_id, p_notes)
  RETURNING id INTO v_doc_id;
  RETURN v_doc_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_expert_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_expert_access_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_expert_codes_for_deal TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_expert_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_expert_task_completion TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_expert_document TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-documents', 'expert-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Deal owners can read expert documents storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'expert-documents'
    AND EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = (split_part(name, '/', 1))::uuid AND d.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.dd_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_tasks TO authenticated;
GRANT SELECT ON public.expert_task_completions TO authenticated;
GRANT SELECT ON public.expert_documents TO authenticated;
GRANT SELECT ON public.expert_access_log TO authenticated;