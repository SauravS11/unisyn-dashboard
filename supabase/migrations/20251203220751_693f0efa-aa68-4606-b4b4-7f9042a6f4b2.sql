-- Add task_id column to deal_documents to track which task a document was uploaded from
ALTER TABLE public.deal_documents 
ADD COLUMN task_id uuid REFERENCES public.deal_tasks(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_deal_documents_task_id ON public.deal_documents(task_id);