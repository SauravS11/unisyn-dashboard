-- Fix search_path / schema for pgcrypto functions used in verify_deal_code
CREATE OR REPLACE FUNCTION public.verify_deal_code(p_deal_code text, p_ip_address text DEFAULT NULL)
RETURNS TABLE(success boolean, message text, access_token text, deal_uuid uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
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

  -- Generate access token (pgcrypto is installed in schema "extensions")
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.deal_access_tokens (deal_id, token_hash, ip_address, expires_at)
  VALUES (v_deal_id, v_token_hash, COALESCE(p_ip_address, 'unknown'), now() + interval '24 hours');

  RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token, v_deal_id;
END;
$$;