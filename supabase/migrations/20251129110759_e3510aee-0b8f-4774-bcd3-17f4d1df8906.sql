-- Drop the existing check constraint and create a new one that includes 'in_progress'
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_status_check;

ALTER TABLE public.deals ADD CONSTRAINT deals_status_check 
  CHECK (status IN ('active', 'completed', 'in_progress'));