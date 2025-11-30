-- Create function to update deal's updated_at when related entities change
CREATE OR REPLACE FUNCTION public.update_deal_timestamp_on_task_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.deals 
  SET updated_at = now() 
  WHERE id = (
    SELECT deal_id FROM public.deal_categories WHERE id = COALESCE(NEW.category_id, OLD.category_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_deal_timestamp_on_related_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.deals 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for deal_tasks changes
CREATE TRIGGER update_deal_on_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.deal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_timestamp_on_task_change();

-- Trigger for deal_documents changes
CREATE TRIGGER update_deal_on_document_change
AFTER INSERT OR UPDATE OR DELETE ON public.deal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();

-- Trigger for deal_team_members changes
CREATE TRIGGER update_deal_on_team_member_change
AFTER INSERT OR UPDATE OR DELETE ON public.deal_team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();

-- Trigger for deal_specialists changes
CREATE TRIGGER update_deal_on_specialist_change
AFTER INSERT OR UPDATE OR DELETE ON public.deal_specialists
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();

-- Trigger for deal_categories changes
CREATE TRIGGER update_deal_on_category_change
AFTER INSERT OR UPDATE OR DELETE ON public.deal_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();