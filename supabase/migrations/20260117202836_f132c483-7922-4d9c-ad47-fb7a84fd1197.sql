-- Step 1: Create a table to track access tokens for verified passcode access
CREATE TABLE IF NOT EXISTS public.deal_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on access tokens table
ALTER TABLE public.deal_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow insert via edge function (service role)
-- No public access to this table
CREATE POLICY "No public access to access tokens"
  ON public.deal_access_tokens FOR ALL
  USING (false);

-- Create rate limiting table for passcode attempts
CREATE TABLE IF NOT EXISTS public.passcode_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS - no public access
ALTER TABLE public.passcode_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to passcode attempts"
  ON public.passcode_attempts FOR ALL
  USING (false);

-- Create index for efficient lookups
CREATE INDEX idx_passcode_attempts_ip_deal ON public.passcode_attempts(ip_address, deal_id, attempted_at);
CREATE INDEX idx_deal_access_tokens_hash ON public.deal_access_tokens(token_hash);
CREATE INDEX idx_deal_access_tokens_expires ON public.deal_access_tokens(expires_at);

-- Create function to verify passcode (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.verify_deal_passcode(
  p_deal_id UUID,
  p_passcode TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, access_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_passcode TEXT;
  v_attempt_count INTEGER;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Check rate limiting (max 5 attempts per IP per deal in last 15 minutes)
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.passcode_attempts
  WHERE deal_id = p_deal_id
    AND ip_address = COALESCE(p_ip_address, 'unknown')
    AND attempted_at > (now() - interval '15 minutes')
    AND success = false;

  IF v_attempt_count >= 5 THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please try again later.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Get stored passcode
  SELECT passcode INTO v_stored_passcode
  FROM public.deals
  WHERE id = p_deal_id;

  IF v_stored_passcode IS NULL THEN
    -- Log attempt
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (p_deal_id, COALESCE(p_ip_address, 'unknown'), false);
    
    RETURN QUERY SELECT false, 'Deal not found or no passcode set.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Verify passcode
  IF v_stored_passcode = p_passcode THEN
    -- Generate access token
    v_token := encode(gen_random_bytes(32), 'hex');
    v_token_hash := encode(sha256(v_token::bytea), 'hex');
    
    -- Store token hash
    INSERT INTO public.deal_access_tokens (deal_id, token_hash, ip_address, expires_at)
    VALUES (p_deal_id, v_token_hash, COALESCE(p_ip_address, 'unknown'), now() + interval '24 hours');
    
    -- Log successful attempt
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (p_deal_id, COALESCE(p_ip_address, 'unknown'), true);
    
    RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token;
  ELSE
    -- Log failed attempt
    INSERT INTO public.passcode_attempts (deal_id, ip_address, success)
    VALUES (p_deal_id, COALESCE(p_ip_address, 'unknown'), false);
    
    RETURN QUERY SELECT false, 'Invalid passcode.'::TEXT, NULL::TEXT;
  END IF;
END;
$$;

-- Create function to validate access token
CREATE OR REPLACE FUNCTION public.validate_deal_access_token(
  p_deal_id UUID,
  p_access_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_hash TEXT;
  v_valid BOOLEAN;
BEGIN
  v_token_hash := encode(sha256(p_access_token::bytea), 'hex');
  
  SELECT EXISTS(
    SELECT 1 FROM public.deal_access_tokens
    WHERE deal_id = p_deal_id
      AND token_hash = v_token_hash
      AND expires_at > now()
  ) INTO v_valid;
  
  RETURN v_valid;
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.verify_deal_passcode TO anon;
GRANT EXECUTE ON FUNCTION public.validate_deal_access_token TO anon;

-- Clean up old access tokens periodically (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.deal_access_tokens WHERE expires_at < now();
  DELETE FROM public.passcode_attempts WHERE attempted_at < (now() - interval '24 hours');
END;
$$;

-- DROP the insecure "anyone can view" policies and replace with secure versions
-- We need to drop the old policies first

-- Deals table: Remove "Anyone can view deals with matching passcode" 
DROP POLICY IF EXISTS "Anyone can view deals with matching passcode" ON public.deals;
DROP POLICY IF EXISTS "Anyone can update deals with passcode" ON public.deals;

-- Deal categories: Remove "Anyone can view categories of deals with passcode"
DROP POLICY IF EXISTS "Anyone can view categories of deals with passcode" ON public.deal_categories;

-- Deal tasks: Remove insecure policies
DROP POLICY IF EXISTS "Anyone can view tasks of deals with passcode" ON public.deal_tasks;
DROP POLICY IF EXISTS "Anyone can update tasks of deals with passcode" ON public.deal_tasks;

-- Deal documents: Remove insecure policies
DROP POLICY IF EXISTS "Anyone can view documents of deals with passcode" ON public.deal_documents;
DROP POLICY IF EXISTS "Anyone can create documents for deals with passcode" ON public.deal_documents;

-- Deal specialists: Remove insecure policies
DROP POLICY IF EXISTS "Anyone can view specialists of deals with passcode" ON public.deal_specialists;
DROP POLICY IF EXISTS "Anyone can create specialists for deals with passcode" ON public.deal_specialists;

-- Deal team members: Remove insecure policies
DROP POLICY IF EXISTS "Anyone can view team members of deals with passcode" ON public.deal_team_members;