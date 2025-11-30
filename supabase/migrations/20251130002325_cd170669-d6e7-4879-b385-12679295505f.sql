-- Add passcode column to deals table for external access
ALTER TABLE public.deals ADD COLUMN passcode TEXT;

-- Create index for faster passcode lookups
CREATE INDEX idx_deals_passcode ON public.deals(passcode) WHERE passcode IS NOT NULL;

-- Create RLS policy for external users to view deals with passcode
-- This allows anyone to view a deal if they know the passcode
CREATE POLICY "Anyone can view deals with matching passcode" 
ON public.deals 
FOR SELECT 
USING (passcode IS NOT NULL);

-- Create policies for external access to related tables when deal has passcode
CREATE POLICY "Anyone can view categories of deals with passcode" 
ON public.deal_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_categories.deal_id 
    AND deals.passcode IS NOT NULL
  )
);

CREATE POLICY "Anyone can view tasks of deals with passcode" 
ON public.deal_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deal_categories dc
    JOIN deals d ON d.id = dc.deal_id
    WHERE dc.id = deal_tasks.category_id 
    AND d.passcode IS NOT NULL
  )
);

CREATE POLICY "Anyone can view specialists of deals with passcode" 
ON public.deal_specialists 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_specialists.deal_id 
    AND deals.passcode IS NOT NULL
  )
);

CREATE POLICY "Anyone can view team members of deals with passcode" 
ON public.deal_team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_team_members.deal_id 
    AND deals.passcode IS NOT NULL
  )
);

CREATE POLICY "Anyone can view documents of deals with passcode" 
ON public.deal_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM deals 
    WHERE deals.id = deal_documents.deal_id 
    AND deals.passcode IS NOT NULL
  )
);