-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_categories table
CREATE TABLE public.deal_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_tasks table
CREATE TABLE public.deal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.deal_categories(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL,
  title TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  has_attachment BOOLEAN NOT NULL DEFAULT false,
  task_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deal_specialists table
CREATE TABLE public.deal_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.deal_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_specialists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Users can view their own deals"
  ON public.deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals"
  ON public.deals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals"
  ON public.deals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for deal_categories
CREATE POLICY "Users can view categories of their deals"
  ON public.deal_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_categories.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can create categories for their deals"
  ON public.deal_categories FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_categories.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update categories of their deals"
  ON public.deal_categories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_categories.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete categories of their deals"
  ON public.deal_categories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_categories.deal_id
    AND deals.user_id = auth.uid()
  ));

-- RLS Policies for deal_tasks
CREATE POLICY "Users can view tasks of their deals"
  ON public.deal_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deal_categories
    JOIN public.deals ON deals.id = deal_categories.deal_id
    WHERE deal_categories.id = deal_tasks.category_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks for their deals"
  ON public.deal_tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deal_categories
    JOIN public.deals ON deals.id = deal_categories.deal_id
    WHERE deal_categories.id = deal_tasks.category_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks of their deals"
  ON public.deal_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deal_categories
    JOIN public.deals ON deals.id = deal_categories.deal_id
    WHERE deal_categories.id = deal_tasks.category_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks of their deals"
  ON public.deal_tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.deal_categories
    JOIN public.deals ON deals.id = deal_categories.deal_id
    WHERE deal_categories.id = deal_tasks.category_id
    AND deals.user_id = auth.uid()
  ));

-- RLS Policies for deal_specialists
CREATE POLICY "Users can view specialists of their deals"
  ON public.deal_specialists FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_specialists.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can create specialists for their deals"
  ON public.deal_specialists FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_specialists.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update specialists of their deals"
  ON public.deal_specialists FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_specialists.deal_id
    AND deals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete specialists of their deals"
  ON public.deal_specialists FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.deals
    WHERE deals.id = deal_specialists.deal_id
    AND deals.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_deal_categories_deal_id ON public.deal_categories(deal_id);
CREATE INDEX idx_deal_tasks_category_id ON public.deal_tasks(category_id);
CREATE INDEX idx_deal_specialists_deal_id ON public.deal_specialists(deal_id);
CREATE INDEX idx_deal_specialists_category_id ON public.deal_specialists(category_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_tasks_updated_at
  BEFORE UPDATE ON public.deal_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();