-- Fix search path for notify_new_deal function
CREATE OR REPLACE FUNCTION public.notify_new_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (NEW.user_id, 'deal_created', 'New Deal Created', 'Deal "' || NEW.name || '" has been created', NEW.id);
  RETURN NEW;
END;
$$;

-- Fix search path for notify_document_upload function
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
BEGIN
  SELECT user_id, name INTO deal_user_id, deal_name
  FROM public.deals
  WHERE id = NEW.deal_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (deal_user_id, 'document_uploaded', 'Document Uploaded', 'Document "' || NEW.file_name || '" uploaded to deal "' || deal_name || '"', NEW.deal_id);
  RETURN NEW;
END;
$$;

-- Fix search path for notify_task_change function
CREATE OR REPLACE FUNCTION public.notify_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
  notification_message text;
BEGIN
  SELECT d.user_id, d.name INTO deal_user_id, deal_name
  FROM public.deals d
  JOIN public.deal_categories dc ON dc.deal_id = d.id
  WHERE dc.id = NEW.category_id;
  
  IF NEW.checked = true AND (OLD.checked = false OR OLD.checked IS NULL) THEN
    notification_message := 'Task "' || NEW.title || '" completed in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_completed', 'Task Completed', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    notification_message := 'Task "' || NEW.title || '" status changed to ' || NEW.status || ' in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  END IF;
  
  RETURN NEW;
END;
$$;