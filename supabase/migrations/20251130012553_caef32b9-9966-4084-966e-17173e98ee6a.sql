-- Create function to notify when close date changes
CREATE OR REPLACE FUNCTION public.notify_close_date_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only trigger if target_close_date actually changed
  IF OLD.target_close_date IS DISTINCT FROM NEW.target_close_date THEN
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (
      NEW.user_id, 
      'close_date_changed', 
      'Close Date Updated', 
      'Target close date for deal "' || NEW.name || '" changed from ' || 
        COALESCE(TO_CHAR(OLD.target_close_date, 'Mon DD, YYYY'), 'Not set') || 
        ' to ' || 
        COALESCE(TO_CHAR(NEW.target_close_date, 'Mon DD, YYYY'), 'Not set'),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for close date changes
DROP TRIGGER IF EXISTS on_close_date_change ON public.deals;
CREATE TRIGGER on_close_date_change
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_close_date_change();