-- Update the generate_deal_code function to create 6-digit numeric codes
CREATE OR REPLACE FUNCTION public.generate_deal_code(deal_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Generate random 6-digit code
  LOOP
    new_code := lpad(floor(random() * 1000000)::text, 6, '0');
    
    -- Check for uniqueness
    IF NOT EXISTS(SELECT 1 FROM public.deals WHERE deal_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique deal code after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Update verify_deal_passcode to work with just the 6-digit code (no separate passcode)
-- This function now just verifies the deal_code exists and returns access
CREATE OR REPLACE FUNCTION public.verify_deal_code(p_deal_code text, p_ip_address text DEFAULT NULL)
RETURNS TABLE(success boolean, message text, access_token text, deal_uuid uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deal_id UUID;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Validate 6-digit format
  IF p_deal_code IS NULL OR length(p_deal_code) != 6 OR p_deal_code !~ '^\d{6}$' THEN
    RETURN QUERY SELECT false, 'Invalid deal code format. Must be 6 digits.'::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Find deal by deal_code
  SELECT id INTO v_deal_id
  FROM public.deals
  WHERE deal_code = p_deal_code;

  IF v_deal_id IS NULL THEN
    RETURN QUERY SELECT false, 'Deal not found.'::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Generate access token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(sha256(v_token::bytea), 'hex');
  
  -- Store token hash
  INSERT INTO public.deal_access_tokens (deal_id, token_hash, ip_address, expires_at)
  VALUES (v_deal_id, v_token_hash, COALESCE(p_ip_address, 'unknown'), now() + interval '24 hours');
  
  RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token, v_deal_id;
END;
$$;