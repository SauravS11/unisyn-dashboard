-- Add RLS policy to allow anyone to update deals with passcode (for target_close_date changes)
CREATE POLICY "Anyone can update deals with passcode" 
ON public.deals 
FOR UPDATE 
USING (passcode IS NOT NULL);