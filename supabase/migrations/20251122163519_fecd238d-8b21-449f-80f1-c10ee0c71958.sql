-- Create table for core deal team members
CREATE TABLE public.deal_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  role TEXT NOT NULL,
  permission_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.deal_team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team members
CREATE POLICY "Users can view team members of their deals"
ON public.deal_team_members
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM deals
  WHERE deals.id = deal_team_members.deal_id
  AND deals.user_id = auth.uid()
));

CREATE POLICY "Users can create team members for their deals"
ON public.deal_team_members
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM deals
  WHERE deals.id = deal_team_members.deal_id
  AND deals.user_id = auth.uid()
));

CREATE POLICY "Users can update team members of their deals"
ON public.deal_team_members
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM deals
  WHERE deals.id = deal_team_members.deal_id
  AND deals.user_id = auth.uid()
));

CREATE POLICY "Users can delete team members of their deals"
ON public.deal_team_members
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM deals
  WHERE deals.id = deal_team_members.deal_id
  AND deals.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deal_team_members_updated_at
BEFORE UPDATE ON public.deal_team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();