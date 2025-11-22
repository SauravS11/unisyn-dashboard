-- Add target_close_date column to deals table
ALTER TABLE public.deals 
ADD COLUMN target_close_date date;