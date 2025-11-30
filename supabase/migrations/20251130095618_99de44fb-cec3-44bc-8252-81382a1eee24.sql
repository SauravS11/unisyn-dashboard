-- Add unique constraint on deal_specialists (deal_id, category_id)
ALTER TABLE public.deal_specialists 
ADD CONSTRAINT deal_specialists_deal_id_category_id_key UNIQUE (deal_id, category_id);