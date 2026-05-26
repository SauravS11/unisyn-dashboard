
DROP FUNCTION IF EXISTS public.register_intake_document(uuid, text, uuid, text, text, text, bigint, text, text);
NOTIFY pgrst, 'reload schema';
