-- Add assigned_to field to deal_tasks for individual task assignment
ALTER TABLE public.deal_tasks 
ADD COLUMN assigned_to TEXT,
ADD COLUMN assigned_email TEXT;