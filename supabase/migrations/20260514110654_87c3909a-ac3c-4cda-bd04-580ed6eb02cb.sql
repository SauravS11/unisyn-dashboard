ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS deal_value text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS deal_stage text,
  ADD COLUMN IF NOT EXISTS lead_advisor text,
  ADD COLUMN IF NOT EXISTS confidentiality_level text;