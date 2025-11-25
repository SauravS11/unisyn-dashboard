-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  deal_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger function for new deals
CREATE OR REPLACE FUNCTION public.notify_new_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (NEW.user_id, 'deal_created', 'New Deal Created', 'Deal "' || NEW.name || '" has been created', NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger for new deals
CREATE TRIGGER notify_on_deal_insert
AFTER INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_deal();

-- Create trigger function for document uploads
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for document uploads
CREATE TRIGGER notify_on_document_upload
AFTER INSERT ON public.deal_documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_document_upload();

-- Create trigger function for task completion and changes
CREATE OR REPLACE FUNCTION public.notify_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for task changes
CREATE TRIGGER notify_on_task_change
AFTER UPDATE ON public.deal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_change();