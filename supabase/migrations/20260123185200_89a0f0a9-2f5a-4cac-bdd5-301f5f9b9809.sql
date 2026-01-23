-- Add deal_code column for user-friendly identifiers
ALTER TABLE public.deals 
ADD COLUMN deal_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_deals_deal_code ON public.deals(deal_code);

-- Create function to generate slug from deal name
CREATE OR REPLACE FUNCTION public.generate_deal_code(deal_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Update existing deals with auto-generated deal codes
UPDATE public.deals 
SET deal_code = public.generate_deal_code(name)
WHERE deal_code IS NULL;

-- Make deal_code NOT NULL after populating existing rows
ALTER TABLE public.deals 
ALTER COLUMN deal_code SET NOT NULL;

-- Create trigger to auto-generate deal_code on insert if not provided
CREATE OR REPLACE FUNCTION public.set_deal_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.deal_code IS NULL OR NEW.deal_code = '' THEN
    NEW.deal_code := public.generate_deal_code(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_deal_code
BEFORE INSERT ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.set_deal_code_on_insert();

-- Update verify_deal_passcode to accept deal_code or UUID
CREATE OR REPLACE FUNCTION public.verify_deal_passcode(p_deal_id TEXT, p_passcode TEXT, p_ip_address TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT, access_token TEXT, deal_uuid UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deal_id UUID;
  v_stored_passcode TEXT;
  v_attempt_count INTEGER;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Try to find deal by UUID or deal_code
  IF p_deal_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id, passcode INTO v_deal_id, v_stored_passcode
    FROM public.deals
    WHERE id = p_deal_id::uuid;
  ELSE
    SELECT id, passcode INTO v_deal_id, v_stored_passcode
    FROM public.deals
    WHERE deal_code = lower(p_deal_id);
  END IF;

  IF v_deal_id IS NULL THEN
    RETURN QUERY SELECT false, 'Deal not found.'::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check rate limiting (max 5 attempts per IP per deal in last 15 minutes)
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.passcode_attempts
  WHERE deal_id = v_deal_id
    AND ip_address = COALESCE(p_ip_address, 'unknown')
    AND attempted_at > (now() - interval '15 minutes')
    AND success = false;

  IF v_attempt_count >= 5 THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please try again later.'::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_stored_passcode IS NULL THEN
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (v_deal_id, COALESCE(p_ip_address, 'unknown'), false);
    
    RETURN QUERY SELECT false, 'No passcode set for this deal.'::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verify passcode
  IF v_stored_passcode = p_passcode THEN
    v_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(sha256(v_token::bytea), 'hex');
    
    INSERT INTO public.deal_access_tokens (deal_id, token_hash, ip_address, expires_at)
    VALUES (v_deal_id, v_token_hash, COALESCE(p_ip_address, 'unknown'), now() + interval '24 hours');
    
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (v_deal_id, COALESCE(p_ip_address, 'unknown'), true);
    
    RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token, v_deal_id;
  ELSE
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (v_deal_id, COALESCE(p_ip_address, 'unknown'), false);
    
    RETURN QUERY SELECT false, 'Invalid passcode.'::TEXT, NULL::TEXT, NULL::UUID;
  END IF;
END;
$$;