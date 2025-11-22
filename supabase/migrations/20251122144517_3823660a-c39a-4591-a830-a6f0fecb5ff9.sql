-- Create deal_documents table to store document metadata
CREATE TABLE public.deal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT,
  notes TEXT,
  CONSTRAINT deal_documents_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for deal_documents
CREATE POLICY "Users can view documents of their deals"
ON public.deal_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_documents.deal_id
    AND deals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documents for their deals"
ON public.deal_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_documents.deal_id
    AND deals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update documents of their deals"
ON public.deal_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_documents.deal_id
    AND deals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents of their deals"
ON public.deal_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_documents.deal_id
    AND deals.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX idx_deal_documents_uploaded_at ON public.deal_documents(uploaded_at DESC);