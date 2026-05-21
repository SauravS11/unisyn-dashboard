CREATE OR REPLACE FUNCTION public.verify_intake_code(p_code text, p_ip text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, message text, access_token text, intake_id uuid, intake_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_intake public.client_intakes%ROWTYPE;
  v_token text;
  v_hash text;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN QUERY SELECT false, 'Code is required.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT ci.* INTO v_intake
  FROM public.client_intakes ci
  WHERE upper(ci.intake_code) = upper(trim(p_code))
     OR ci.secure_link_token = trim(p_code)
  LIMIT 1;

  IF v_intake.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid code.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF v_intake.status IN ('draft') THEN
    RETURN QUERY SELECT false, 'This request has not been sent yet.'::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.intake_access_tokens (client_intake_id, token_hash, ip_address, user_agent)
  VALUES (v_intake.id, v_hash, COALESCE(p_ip, 'unknown'), p_user_agent);

  IF v_intake.status = 'request_sent' THEN
    UPDATE public.client_intakes SET status = 'awaiting_response' WHERE id = v_intake.id;
  END IF;

  INSERT INTO public.intake_activity_log (client_intake_id, activity_type, description, actor_type)
  VALUES (v_intake.id, 'respondent_accessed', 'Respondent opened the portal', 'respondent');

  RETURN QUERY SELECT true, 'Access granted.'::text, v_token, v_intake.id, v_intake.intake_code;
END;
$function$;