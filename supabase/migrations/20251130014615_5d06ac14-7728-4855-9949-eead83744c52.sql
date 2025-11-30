-- Add RLS policy to allow anyone to insert specialists for deals with passcode
CREATE POLICY "Anyone can create specialists for deals with passcode" 
ON public.deal_specialists 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1 FROM deals 
  WHERE deals.id = deal_specialists.deal_id 
  AND deals.passcode IS NOT NULL
));