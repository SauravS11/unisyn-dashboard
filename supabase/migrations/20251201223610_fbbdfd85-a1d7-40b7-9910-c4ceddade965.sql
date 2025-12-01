-- Drop the unique constraint that prevents multiple specialists per category
ALTER TABLE public.deal_specialists 
DROP CONSTRAINT IF EXISTS deal_specialists_deal_id_category_id_key;