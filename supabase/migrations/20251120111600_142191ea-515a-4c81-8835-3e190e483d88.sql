-- Add unique constraints to support upsert on deal checklist tables
ALTER TABLE public.deal_categories
ADD CONSTRAINT deal_categories_deal_id_category_code_key
UNIQUE (deal_id, category_code);

ALTER TABLE public.deal_specialists
ADD CONSTRAINT deal_specialists_deal_id_category_id_key
UNIQUE (deal_id, category_id);

ALTER TABLE public.deal_tasks
ADD CONSTRAINT deal_tasks_category_id_task_code_key
UNIQUE (category_id, task_code);