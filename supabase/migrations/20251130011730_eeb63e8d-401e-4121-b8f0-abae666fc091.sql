-- Create function to notify when a specialist is added
CREATE OR REPLACE FUNCTION public.notify_specialist_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
  category_title text;
BEGIN
  -- Get deal info
  SELECT d.user_id, d.name INTO deal_user_id, deal_name
  FROM public.deals d
  WHERE d.id = NEW.deal_id;
  
  -- Get category title
  SELECT dc.title INTO category_title
  FROM public.deal_categories dc
  WHERE dc.id = NEW.category_id;
  
  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (
    deal_user_id, 
    'specialist_added', 
    'Specialist Added', 
    'Specialist "' || NEW.name || '" has been assigned to "' || COALESCE(category_title, 'Unknown Category') || '" in deal "' || deal_name || '"',
    NEW.deal_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for specialist additions
CREATE TRIGGER on_specialist_added
  AFTER INSERT ON public.deal_specialists
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_specialist_added();