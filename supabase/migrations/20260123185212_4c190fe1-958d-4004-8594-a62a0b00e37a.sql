-- Fix search_path for generate_deal_code function
CREATE OR REPLACE FUNCTION public.generate_deal_code(deal_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_code := lower(regexp_replace(deal_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_code := regexp_replace(base_code, '\s+', '-', 'g');
  base_code := left(base_code, 20); -- Limit to 20 chars
  
  final_code := base_code;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS(SELECT 1 FROM public.deals WHERE deal_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || '-' || counter;
  END LOOP;
  
  RETURN final_code;
END;
$$;