-- Add UPDATE policies for external users with passcode access
CREATE POLICY "Anyone can update tasks of deals with passcode" 
ON public.deal_tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM deal_categories dc
    JOIN deals d ON d.id = dc.deal_id
    WHERE dc.id = deal_tasks.category_id 
    AND d.passcode IS NOT NULL
  )
);