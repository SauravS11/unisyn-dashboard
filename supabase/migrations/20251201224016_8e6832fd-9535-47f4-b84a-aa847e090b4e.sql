-- Update the notify_task_change function to include date and assignment changes
CREATE OR REPLACE FUNCTION public.notify_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  deal_user_id uuid;
  deal_name text;
  notification_message text;
BEGIN
  SELECT d.user_id, d.name INTO deal_user_id, deal_name
  FROM public.deals d
  JOIN public.deal_categories dc ON dc.deal_id = d.id
  WHERE dc.id = NEW.category_id;
  
  -- Task completed
  IF NEW.checked = true AND (OLD.checked = false OR OLD.checked IS NULL) THEN
    notification_message := 'Task "' || NEW.title || '" completed in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_completed', 'Task Completed', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Status changed
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    notification_message := 'Task "' || NEW.title || '" status changed to ' || NEW.status || ' in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Due date changed
  ELSIF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    notification_message := 'Due date ' || 
      CASE 
        WHEN NEW.due_date IS NULL THEN 'removed from'
        WHEN OLD.due_date IS NULL THEN 'added to'
        ELSE 'changed for'
      END || 
      ' task "' || NEW.title || '" in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Due Date Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Assignment changed
  ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to OR OLD.assigned_email IS DISTINCT FROM NEW.assigned_email THEN
    notification_message := 'Task "' || NEW.title || '" ' ||
      CASE 
        WHEN NEW.assigned_to IS NULL THEN 'unassigned'
        WHEN OLD.assigned_to IS NULL THEN 'assigned to ' || NEW.assigned_to
        ELSE 'reassigned to ' || NEW.assigned_to
      END || 
      ' in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Assignment Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  END IF;
  
  RETURN NEW;
END;
$function$;