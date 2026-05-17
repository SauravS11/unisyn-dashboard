--
-- PostgreSQL database dump
--

\restrict HvNxiJqlb9ckXMDeAQRdmop6QIb2rsduHk3aY8sqCtJrG3o6phMqgWOUgQDNGkZ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = off;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET escape_string_warning = off;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: cleanup_expired_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_expired_tokens() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.deal_access_tokens WHERE expires_at < now();
  DELETE FROM public.passcode_attempts WHERE attempted_at < (now() - interval '24 hours');
END;
$$;


--
-- Name: deal_exists(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deal_exists(deal_id_text text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deals
    WHERE id::text = deal_id_text
  );
$$;


--
-- Name: deal_exists_uuid(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deal_exists_uuid(p_deal_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (SELECT 1 FROM public.deals WHERE id = p_deal_id);
$$;


--
-- Name: deal_has_passcode(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deal_has_passcode(deal_id_text text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.deals
    WHERE id::text = deal_id_text
    AND passcode IS NOT NULL
  );
$$;


--
-- Name: generate_deal_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_deal_code(deal_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: generate_expert_access_code(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_expert_access_code(p_category_no integer) RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_code := public.generate_expert_code_segment() || '-CAT' || lpad(p_category_no::text, 2, '0');
    IF NOT EXISTS (SELECT 1 FROM public.expert_codes WHERE code = new_code) THEN
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Could not generate unique expert code';
    END IF;
  END LOOP;
END;
$$;


--
-- Name: generate_expert_code_segment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_expert_code_segment() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;


--
-- Name: generate_expert_codes_for_deal(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_expert_codes_for_deal(p_deal_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  cat RECORD;
  new_code TEXT;
  inserted_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.deals WHERE id = p_deal_id) THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.deals WHERE id = p_deal_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to manage this deal';
  END IF;
  FOR cat IN SELECT id, category_no FROM public.dd_categories ORDER BY category_no LOOP
    IF NOT EXISTS (SELECT 1 FROM public.expert_codes WHERE deal_id = p_deal_id AND category_id = cat.id) THEN
      new_code := public.generate_expert_access_code(cat.category_no);
      INSERT INTO public.expert_codes (deal_id, category_id, code) VALUES (p_deal_id, cat.id, new_code);
      inserted_count := inserted_count + 1;
    END IF;
    PERFORM public.seed_expert_tasks_for_category(p_deal_id, cat.id);
  END LOOP;
  RETURN inserted_count;
END;
$$;


--
-- Name: notify_close_date_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_close_date_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only trigger if target_close_date actually changed
  IF OLD.target_close_date IS DISTINCT FROM NEW.target_close_date THEN
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (
      NEW.user_id, 
      'close_date_changed', 
      'Close Date Updated', 
      'Target close date for deal "' || NEW.name || '" changed from ' || 
        COALESCE(TO_CHAR(OLD.target_close_date, 'Mon DD, YYYY'), 'Not set') || 
        ' to ' || 
        COALESCE(TO_CHAR(NEW.target_close_date, 'Mon DD, YYYY'), 'Not set'),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: notify_document_upload(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_document_upload() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
BEGIN
  SELECT user_id, name INTO deal_user_id, deal_name
  FROM public.deals
  WHERE id = NEW.deal_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (deal_user_id, 'document_uploaded', 'Document Uploaded', 'Document "' || NEW.file_name || '" uploaded to deal "' || deal_name || '"', NEW.deal_id);
  RETURN NEW;
END;
$$;


--
-- Name: notify_new_deal(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_new_deal() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (NEW.user_id, 'deal_created', 'New Deal Created', 'Deal "' || NEW.name || '" has been created', NEW.id);
  RETURN NEW;
END;
$$;


--
-- Name: notify_specialist_added(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_specialist_added() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
  category_title text;
BEGIN
  -- Get deal info
  SELECT d.user_id, d.name INTO deal_user_id, deal_name
  FROM public.deals d
  WHERE d.id = NEW.deal_id;
  
  -- Get category title
  SELECT dc.title INTO category_title
  FROM public.deal_categories dc
  WHERE dc.id = NEW.category_id;
  
  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, message, deal_id)
  VALUES (
    deal_user_id, 
    'specialist_added', 
    'Specialist Added', 
    'Specialist "' || NEW.name || '" has been assigned to "' || COALESCE(category_title, 'Unknown Category') || '" in deal "' || deal_name || '"',
    NEW.deal_id
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: notify_task_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_task_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  deal_user_id uuid;
  deal_name text;
  notification_message text;
BEGIN
  SELECT d.user_id, d.name INTO deal_user_id, deal_name
  FROM public.deals d
  JOIN public.deal_categories dc ON dc.deal_id = d.id
  WHERE dc.id = NEW.category_id;
  
  -- Task completed
  IF NEW.checked = true AND (OLD.checked = false OR OLD.checked IS NULL) THEN
    notification_message := 'Task "' || NEW.title || '" completed in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_completed', 'Task Completed', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Status changed
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    notification_message := 'Task "' || NEW.title || '" status changed to ' || NEW.status || ' in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Due date changed
  ELSIF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    notification_message := 'Due date ' || 
      CASE 
        WHEN NEW.due_date IS NULL THEN 'removed from'
        WHEN OLD.due_date IS NULL THEN 'added to'
        ELSE 'changed for'
      END || 
      ' task "' || NEW.title || '" in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Due Date Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  
  -- Assignment changed
  ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to OR OLD.assigned_email IS DISTINCT FROM NEW.assigned_email THEN
    notification_message := 'Task "' || NEW.title || '" ' ||
      CASE 
        WHEN NEW.assigned_to IS NULL THEN 'unassigned'
        WHEN OLD.assigned_to IS NULL THEN 'assigned to ' || NEW.assigned_to
        ELSE 'reassigned to ' || NEW.assigned_to
      END || 
      ' in deal "' || deal_name || '"';
    INSERT INTO public.notifications (user_id, type, title, message, deal_id)
    VALUES (deal_user_id, 'task_changed', 'Task Assignment Updated', notification_message, 
            (SELECT d.id FROM public.deals d JOIN public.deal_categories dc ON dc.deal_id = d.id WHERE dc.id = NEW.category_id));
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: regenerate_expert_code(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.regenerate_expert_code(p_code_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_category_no INTEGER;
  new_code TEXT;
BEGIN
  SELECT dc.category_no INTO v_category_no
  FROM public.expert_codes ec
  JOIN public.dd_categories dc ON dc.id = ec.category_id
  WHERE ec.id = p_code_id;
  IF v_category_no IS NULL THEN
    RAISE EXCEPTION 'Expert code not found';
  END IF;
  new_code := public.generate_expert_access_code(v_category_no);
  UPDATE public.expert_codes
  SET code = new_code, is_active = true, last_accessed_at = NULL
  WHERE id = p_code_id;
  RETURN new_code;
END;
$$;


--
-- Name: register_expert_document(uuid, text, text, text, integer, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.register_expert_document(p_code_id uuid, p_access_token text, p_file_name text, p_file_url text, p_file_size_bytes integer DEFAULT NULL::integer, p_mime_type text DEFAULT NULL::text, p_task_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_deal_id UUID;
  v_category_id UUID;
  v_doc_id UUID;
BEGIN
  IF NOT public.validate_expert_access_token(p_code_id, p_access_token) THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  SELECT deal_id, category_id INTO v_deal_id, v_category_id FROM public.expert_codes WHERE id = p_code_id;
  INSERT INTO public.expert_documents (deal_id, category_id, code_id, file_name, file_url, file_size_bytes, mime_type, task_id, notes)
  VALUES (v_deal_id, v_category_id, p_code_id, p_file_name, p_file_url, p_file_size_bytes, p_mime_type, p_task_id, p_notes)
  RETURNING id INTO v_doc_id;
  RETURN v_doc_id;
END;
$$;


--
-- Name: seed_expert_tasks_for_category(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.seed_expert_tasks_for_category(p_deal_id uuid, p_category_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.expert_tasks WHERE deal_id = p_deal_id AND category_id = p_category_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.expert_tasks (deal_id, category_id, title, description, sort_order) VALUES
    (p_deal_id, p_category_id, 'Review category documentation requirements', 'Confirm you have received all required document lists', 1),
    (p_deal_id, p_category_id, 'Gather and organise source materials', 'Collect all relevant files and data for this workstream', 2),
    (p_deal_id, p_category_id, 'Complete technical analysis', 'Perform your specialist review and document findings', 3),
    (p_deal_id, p_category_id, 'Upload supporting documents', 'Submit all reports, schedules, and evidence files', 4),
    (p_deal_id, p_category_id, 'Submit final deliverables', 'Upload your completed work product for this category', 5);
END;
$$;


--
-- Name: set_deal_code_on_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_deal_code_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.deal_code IS NULL OR NEW.deal_code = '' THEN
    NEW.deal_code := public.generate_deal_code(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: toggle_expert_task_completion(uuid, uuid, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.toggle_expert_task_completion(p_code_id uuid, p_task_id uuid, p_is_complete boolean, p_access_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NOT public.validate_expert_access_token(p_code_id, p_access_token) THEN
    RETURN false;
  END IF;
  INSERT INTO public.expert_task_completions (task_id, code_id, is_complete, completed_at)
  VALUES (p_task_id, p_code_id, p_is_complete, CASE WHEN p_is_complete THEN now() ELSE NULL END)
  ON CONFLICT (task_id, code_id)
  DO UPDATE SET is_complete = EXCLUDED.is_complete, completed_at = EXCLUDED.completed_at;
  RETURN true;
END;
$$;


--
-- Name: update_deal_timestamp_on_related_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_deal_timestamp_on_related_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.deals 
  SET updated_at = now() 
  WHERE id = COALESCE(NEW.deal_id, OLD.deal_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_deal_timestamp_on_task_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_deal_timestamp_on_task_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.deals 
  SET updated_at = now() 
  WHERE id = (
    SELECT deal_id FROM public.deal_categories WHERE id = COALESCE(NEW.category_id, OLD.category_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: validate_deal_access_token(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_deal_access_token(p_deal_id uuid, p_access_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: validate_expert_access_token(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_expert_access_token(p_code_id uuid, p_access_token text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_token_hash TEXT;
BEGIN
  v_token_hash := encode(digest(p_access_token, 'sha256'), 'hex');
  RETURN EXISTS (
    SELECT 1 FROM public.expert_access_tokens
    WHERE code_id = p_code_id AND token_hash = v_token_hash AND expires_at > now()
  );
END;
$$;


--
-- Name: verify_deal_code(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_deal_code(p_deal_code text, p_ip_address text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text, access_token text, deal_uuid uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $_$
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
$_$;


--
-- Name: verify_deal_passcode(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_deal_passcode(p_deal_id text, p_passcode text, p_ip_address text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text, access_token text, deal_uuid uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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
$_$;


--
-- Name: verify_deal_passcode(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_deal_passcode(p_deal_id uuid, p_passcode text, p_ip_address text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text, access_token text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: verify_expert_code(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verify_expert_code(p_code text, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text) RETURNS TABLE(success boolean, message text, access_token text, code_id uuid, deal_id uuid, category_id uuid, expert_code text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_code_row public.expert_codes%ROWTYPE;
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN QUERY SELECT false, 'Access code is required.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  SELECT * INTO v_code_row FROM public.expert_codes WHERE upper(trim(code)) = upper(trim(p_code));
  IF v_code_row.id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid access code.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  IF NOT v_code_row.is_active THEN
    RETURN QUERY SELECT false, 'This access code has been revoked.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  IF v_code_row.expires_at IS NOT NULL AND v_code_row.expires_at < now() THEN
    RETURN QUERY SELECT false, 'This access code has expired.'::TEXT, NULL::TEXT, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  INSERT INTO public.expert_access_tokens (code_id, token_hash, ip_address, user_agent, expires_at)
  VALUES (v_code_row.id, v_token_hash, COALESCE(p_ip_address, 'unknown'), p_user_agent, now() + interval '24 hours');
  INSERT INTO public.expert_access_log (code_id, ip_address, user_agent)
  VALUES (v_code_row.id, COALESCE(p_ip_address, 'unknown'), p_user_agent);
  UPDATE public.expert_codes SET last_accessed_at = now() WHERE id = v_code_row.id;
  RETURN QUERY SELECT true, 'Access granted.'::TEXT, v_token, v_code_row.id, v_code_row.deal_id, v_code_row.category_id, v_code_row.code;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dd_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dd_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_no integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: deal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_access_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    token_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    ip_address text,
    user_agent text
);


--
-- Name: deal_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    category_code text NOT NULL,
    title text NOT NULL,
    category_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    file_type text,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    category text,
    notes text,
    task_id uuid
);


--
-- Name: deal_specialists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_specialists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deal_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    task_code text NOT NULL,
    title text NOT NULL,
    checked boolean DEFAULT false NOT NULL,
    notes text,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    has_attachment boolean DEFAULT false NOT NULL,
    task_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_to text,
    assigned_email text
);


--
-- Name: deal_team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    contact_number text NOT NULL,
    role text NOT NULL,
    permission_level text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    target_close_date date,
    status text DEFAULT 'active'::text NOT NULL,
    passcode text,
    buyer_name text,
    buyer_email text,
    seller_name text,
    seller_email text,
    buyer_legal_name text,
    buyer_legal_email text,
    seller_legal_name text,
    seller_legal_email text,
    deal_code text NOT NULL,
    deal_value text,
    industry text,
    deal_stage text,
    lead_advisor text,
    confidentiality_level text,
    selected_categories text[],
    CONSTRAINT deals_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'in_progress'::text])))
);


--
-- Name: expert_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_access_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code_id uuid NOT NULL,
    ip_address text,
    user_agent text,
    accessed_at timestamp with time zone DEFAULT now()
);


--
-- Name: expert_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_access_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code_id uuid NOT NULL,
    token_hash text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL
);


--
-- Name: expert_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    category_id uuid NOT NULL,
    code text NOT NULL,
    expert_name text,
    expert_email text,
    instructions text,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    last_accessed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: expert_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    category_id uuid NOT NULL,
    code_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_size_bytes integer,
    mime_type text,
    task_id uuid,
    uploaded_at timestamp with time zone DEFAULT now(),
    notes text
);


--
-- Name: expert_task_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_task_completions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    code_id uuid NOT NULL,
    is_complete boolean DEFAULT false,
    completed_at timestamp with time zone,
    notes text
);


--
-- Name: expert_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expert_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    is_required boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    deal_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: passcode_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.passcode_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deal_id uuid NOT NULL,
    ip_address text NOT NULL,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL,
    success boolean DEFAULT false NOT NULL
);


--
-- Name: dd_categories dd_categories_category_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_categories
    ADD CONSTRAINT dd_categories_category_no_key UNIQUE (category_no);


--
-- Name: dd_categories dd_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dd_categories
    ADD CONSTRAINT dd_categories_pkey PRIMARY KEY (id);


--
-- Name: deal_access_tokens deal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_access_tokens
    ADD CONSTRAINT deal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: deal_categories deal_categories_deal_id_category_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_categories
    ADD CONSTRAINT deal_categories_deal_id_category_code_key UNIQUE (deal_id, category_code);


--
-- Name: deal_categories deal_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_categories
    ADD CONSTRAINT deal_categories_pkey PRIMARY KEY (id);


--
-- Name: deal_documents deal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_documents
    ADD CONSTRAINT deal_documents_pkey PRIMARY KEY (id);


--
-- Name: deal_specialists deal_specialists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_specialists
    ADD CONSTRAINT deal_specialists_pkey PRIMARY KEY (id);


--
-- Name: deal_tasks deal_tasks_category_id_task_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_tasks
    ADD CONSTRAINT deal_tasks_category_id_task_code_key UNIQUE (category_id, task_code);


--
-- Name: deal_tasks deal_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_tasks
    ADD CONSTRAINT deal_tasks_pkey PRIMARY KEY (id);


--
-- Name: deal_team_members deal_team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_team_members
    ADD CONSTRAINT deal_team_members_pkey PRIMARY KEY (id);


--
-- Name: deals deals_deal_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_deal_code_key UNIQUE (deal_code);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: expert_access_log expert_access_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_access_log
    ADD CONSTRAINT expert_access_log_pkey PRIMARY KEY (id);


--
-- Name: expert_access_tokens expert_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_access_tokens
    ADD CONSTRAINT expert_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: expert_codes expert_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_codes
    ADD CONSTRAINT expert_codes_code_key UNIQUE (code);


--
-- Name: expert_codes expert_codes_deal_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_codes
    ADD CONSTRAINT expert_codes_deal_id_category_id_key UNIQUE (deal_id, category_id);


--
-- Name: expert_codes expert_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_codes
    ADD CONSTRAINT expert_codes_pkey PRIMARY KEY (id);


--
-- Name: expert_documents expert_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_documents
    ADD CONSTRAINT expert_documents_pkey PRIMARY KEY (id);


--
-- Name: expert_task_completions expert_task_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_task_completions
    ADD CONSTRAINT expert_task_completions_pkey PRIMARY KEY (id);


--
-- Name: expert_task_completions expert_task_completions_task_id_code_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_task_completions
    ADD CONSTRAINT expert_task_completions_task_id_code_id_key UNIQUE (task_id, code_id);


--
-- Name: expert_tasks expert_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_tasks
    ADD CONSTRAINT expert_tasks_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: passcode_attempts passcode_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passcode_attempts
    ADD CONSTRAINT passcode_attempts_pkey PRIMARY KEY (id);


--
-- Name: idx_deal_access_tokens_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_access_tokens_expires ON public.deal_access_tokens USING btree (expires_at);


--
-- Name: idx_deal_access_tokens_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_access_tokens_hash ON public.deal_access_tokens USING btree (token_hash);


--
-- Name: idx_deal_categories_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_categories_deal_id ON public.deal_categories USING btree (deal_id);


--
-- Name: idx_deal_documents_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_documents_deal_id ON public.deal_documents USING btree (deal_id);


--
-- Name: idx_deal_documents_task_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_documents_task_id ON public.deal_documents USING btree (task_id);


--
-- Name: idx_deal_documents_uploaded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_documents_uploaded_at ON public.deal_documents USING btree (uploaded_at DESC);


--
-- Name: idx_deal_specialists_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_specialists_category_id ON public.deal_specialists USING btree (category_id);


--
-- Name: idx_deal_specialists_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_specialists_deal_id ON public.deal_specialists USING btree (deal_id);


--
-- Name: idx_deal_tasks_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_tasks_category_id ON public.deal_tasks USING btree (category_id);


--
-- Name: idx_deals_deal_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_deal_code ON public.deals USING btree (deal_code);


--
-- Name: idx_deals_passcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_passcode ON public.deals USING btree (passcode) WHERE (passcode IS NOT NULL);


--
-- Name: idx_deals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_status ON public.deals USING btree (status);


--
-- Name: idx_expert_access_log_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_access_log_code ON public.expert_access_log USING btree (code_id, accessed_at DESC);


--
-- Name: idx_expert_access_tokens_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_access_tokens_hash ON public.expert_access_tokens USING btree (token_hash);


--
-- Name: idx_expert_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_codes_code ON public.expert_codes USING btree (code);


--
-- Name: idx_expert_codes_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_codes_deal ON public.expert_codes USING btree (deal_id);


--
-- Name: idx_expert_docs_deal_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_docs_deal_cat ON public.expert_documents USING btree (deal_id, category_id);


--
-- Name: idx_expert_tasks_deal_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expert_tasks_deal_cat ON public.expert_tasks USING btree (deal_id, category_id);


--
-- Name: idx_passcode_attempts_ip_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_passcode_attempts_ip_deal ON public.passcode_attempts USING btree (ip_address, deal_id, attempted_at);


--
-- Name: deals notify_on_deal_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_on_deal_insert AFTER INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION public.notify_new_deal();


--
-- Name: deal_documents notify_on_document_upload; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_on_document_upload AFTER INSERT ON public.deal_documents FOR EACH ROW EXECUTE FUNCTION public.notify_document_upload();


--
-- Name: deal_tasks notify_on_task_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notify_on_task_change AFTER UPDATE ON public.deal_tasks FOR EACH ROW EXECUTE FUNCTION public.notify_task_change();


--
-- Name: deals on_close_date_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_close_date_change AFTER UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.notify_close_date_change();


--
-- Name: deal_specialists on_specialist_added; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_specialist_added AFTER INSERT ON public.deal_specialists FOR EACH ROW EXECUTE FUNCTION public.notify_specialist_added();


--
-- Name: deals trigger_set_deal_code; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_set_deal_code BEFORE INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_deal_code_on_insert();


--
-- Name: deal_categories update_deal_on_category_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_on_category_change AFTER INSERT OR DELETE OR UPDATE ON public.deal_categories FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();


--
-- Name: deal_documents update_deal_on_document_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_on_document_change AFTER INSERT OR DELETE OR UPDATE ON public.deal_documents FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();


--
-- Name: deal_specialists update_deal_on_specialist_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_on_specialist_change AFTER INSERT OR DELETE OR UPDATE ON public.deal_specialists FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();


--
-- Name: deal_tasks update_deal_on_task_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_on_task_change AFTER INSERT OR DELETE OR UPDATE ON public.deal_tasks FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp_on_task_change();


--
-- Name: deal_team_members update_deal_on_team_member_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_on_team_member_change AFTER INSERT OR DELETE OR UPDATE ON public.deal_team_members FOR EACH ROW EXECUTE FUNCTION public.update_deal_timestamp_on_related_change();


--
-- Name: deal_tasks update_deal_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_tasks_updated_at BEFORE UPDATE ON public.deal_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deal_team_members update_deal_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deal_team_members_updated_at BEFORE UPDATE ON public.deal_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deals update_deals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: deal_access_tokens deal_access_tokens_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_access_tokens
    ADD CONSTRAINT deal_access_tokens_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_categories deal_categories_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_categories
    ADD CONSTRAINT deal_categories_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_documents deal_documents_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_documents
    ADD CONSTRAINT deal_documents_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_documents deal_documents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_documents
    ADD CONSTRAINT deal_documents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.deal_tasks(id) ON DELETE SET NULL;


--
-- Name: deal_specialists deal_specialists_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_specialists
    ADD CONSTRAINT deal_specialists_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.deal_categories(id) ON DELETE CASCADE;


--
-- Name: deal_specialists deal_specialists_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_specialists
    ADD CONSTRAINT deal_specialists_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_tasks deal_tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_tasks
    ADD CONSTRAINT deal_tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.deal_categories(id) ON DELETE CASCADE;


--
-- Name: expert_access_log expert_access_log_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_access_log
    ADD CONSTRAINT expert_access_log_code_id_fkey FOREIGN KEY (code_id) REFERENCES public.expert_codes(id);


--
-- Name: expert_access_tokens expert_access_tokens_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_access_tokens
    ADD CONSTRAINT expert_access_tokens_code_id_fkey FOREIGN KEY (code_id) REFERENCES public.expert_codes(id) ON DELETE CASCADE;


--
-- Name: expert_codes expert_codes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_codes
    ADD CONSTRAINT expert_codes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.dd_categories(id);


--
-- Name: expert_codes expert_codes_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_codes
    ADD CONSTRAINT expert_codes_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: expert_documents expert_documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_documents
    ADD CONSTRAINT expert_documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.dd_categories(id);


--
-- Name: expert_documents expert_documents_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_documents
    ADD CONSTRAINT expert_documents_code_id_fkey FOREIGN KEY (code_id) REFERENCES public.expert_codes(id);


--
-- Name: expert_documents expert_documents_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_documents
    ADD CONSTRAINT expert_documents_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: expert_documents expert_documents_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_documents
    ADD CONSTRAINT expert_documents_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.expert_tasks(id);


--
-- Name: expert_task_completions expert_task_completions_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_task_completions
    ADD CONSTRAINT expert_task_completions_code_id_fkey FOREIGN KEY (code_id) REFERENCES public.expert_codes(id) ON DELETE CASCADE;


--
-- Name: expert_task_completions expert_task_completions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_task_completions
    ADD CONSTRAINT expert_task_completions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.expert_tasks(id) ON DELETE CASCADE;


--
-- Name: expert_tasks expert_tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_tasks
    ADD CONSTRAINT expert_tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.dd_categories(id);


--
-- Name: expert_tasks expert_tasks_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expert_tasks
    ADD CONSTRAINT expert_tasks_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: passcode_attempts passcode_attempts_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.passcode_attempts
    ADD CONSTRAINT passcode_attempts_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_documents Anyone can create deal documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create deal documents" ON public.deal_documents FOR INSERT WITH CHECK (public.deal_exists_uuid(deal_id));


--
-- Name: deal_documents Anyone can delete deal documents external; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can delete deal documents external" ON public.deal_documents FOR DELETE USING (public.deal_exists_uuid(deal_id));


--
-- Name: deal_documents Anyone can view deal documents external; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view deal documents external" ON public.deal_documents FOR SELECT USING (public.deal_exists_uuid(deal_id));


--
-- Name: dd_categories Authenticated users can view dd categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view dd categories" ON public.dd_categories FOR SELECT TO authenticated USING (true);


--
-- Name: expert_codes Deal owners manage expert codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deal owners manage expert codes" ON public.expert_codes TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.deals d
  WHERE ((d.id = expert_codes.deal_id) AND (d.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals d
  WHERE ((d.id = expert_codes.deal_id) AND (d.user_id = auth.uid())))));


--
-- Name: expert_tasks Deal owners manage expert tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deal owners manage expert tasks" ON public.expert_tasks TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.deals d
  WHERE ((d.id = expert_tasks.deal_id) AND (d.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals d
  WHERE ((d.id = expert_tasks.deal_id) AND (d.user_id = auth.uid())))));


--
-- Name: expert_access_log Deal owners view expert access log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deal owners view expert access log" ON public.expert_access_log FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.expert_codes ec
     JOIN public.deals d ON ((d.id = ec.deal_id)))
  WHERE ((ec.id = expert_access_log.code_id) AND (d.user_id = auth.uid())))));


--
-- Name: expert_task_completions Deal owners view expert completions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deal owners view expert completions" ON public.expert_task_completions FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.expert_codes ec
     JOIN public.deals d ON ((d.id = ec.deal_id)))
  WHERE ((ec.id = expert_task_completions.code_id) AND (d.user_id = auth.uid())))));


--
-- Name: expert_documents Deal owners view expert documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deal owners view expert documents" ON public.expert_documents FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.deals d
  WHERE ((d.id = expert_documents.deal_id) AND (d.user_id = auth.uid())))));


--
-- Name: deal_access_tokens No public access to access tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public access to access tokens" ON public.deal_access_tokens USING (false);


--
-- Name: expert_access_tokens No public access to expert tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public access to expert tokens" ON public.expert_access_tokens USING (false);


--
-- Name: passcode_attempts No public access to passcode attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "No public access to passcode attempts" ON public.passcode_attempts USING (false);


--
-- Name: deal_categories Users can create categories for their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create categories for their deals" ON public.deal_categories FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_categories.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_documents Users can create documents for their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create documents for their deals" ON public.deal_documents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_documents.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_specialists Users can create specialists for their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create specialists for their deals" ON public.deal_specialists FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_specialists.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_tasks Users can create tasks for their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create tasks for their deals" ON public.deal_tasks FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.deal_categories
     JOIN public.deals ON ((deals.id = deal_categories.deal_id)))
  WHERE ((deal_categories.id = deal_tasks.category_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_team_members Users can create team members for their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create team members for their deals" ON public.deal_team_members FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_team_members.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deals Users can create their own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own deals" ON public.deals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: deal_categories Users can delete categories of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete categories of their deals" ON public.deal_categories FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_categories.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_documents Users can delete documents of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete documents of their deals" ON public.deal_documents FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_documents.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_specialists Users can delete specialists of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete specialists of their deals" ON public.deal_specialists FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_specialists.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_tasks Users can delete tasks of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete tasks of their deals" ON public.deal_tasks FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.deal_categories
     JOIN public.deals ON ((deals.id = deal_categories.deal_id)))
  WHERE ((deal_categories.id = deal_tasks.category_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_team_members Users can delete team members of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete team members of their deals" ON public.deal_team_members FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_team_members.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deals Users can delete their own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own deals" ON public.deals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: deal_categories Users can update categories of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update categories of their deals" ON public.deal_categories FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_categories.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_documents Users can update documents of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update documents of their deals" ON public.deal_documents FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_documents.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_specialists Users can update specialists of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update specialists of their deals" ON public.deal_specialists FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_specialists.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_tasks Users can update tasks of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks of their deals" ON public.deal_tasks FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.deal_categories
     JOIN public.deals ON ((deals.id = deal_categories.deal_id)))
  WHERE ((deal_categories.id = deal_tasks.category_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_team_members Users can update team members of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update team members of their deals" ON public.deal_team_members FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_team_members.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deals Users can update their own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own deals" ON public.deals FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: deal_categories Users can view categories of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view categories of their deals" ON public.deal_categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_categories.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_documents Users can view documents of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view documents of their deals" ON public.deal_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_documents.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_specialists Users can view specialists of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view specialists of their deals" ON public.deal_specialists FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_specialists.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_tasks Users can view tasks of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks of their deals" ON public.deal_tasks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.deal_categories
     JOIN public.deals ON ((deals.id = deal_categories.deal_id)))
  WHERE ((deal_categories.id = deal_tasks.category_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deal_team_members Users can view team members of their deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view team members of their deals" ON public.deal_team_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.deals
  WHERE ((deals.id = deal_team_members.deal_id) AND (deals.user_id = auth.uid())))));


--
-- Name: deals Users can view their own deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own deals" ON public.deals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dd_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dd_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_access_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_specialists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_specialists ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_team_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_team_members ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_access_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_access_log ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_access_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_task_completions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_task_completions ENABLE ROW LEVEL SECURITY;

--
-- Name: expert_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expert_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: passcode_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.passcode_attempts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict HvNxiJqlb9ckXMDeAQRdmop6QIb2rsduHk3aY8sqCtJrG3o6phMqgWOUgQDNGkZ

