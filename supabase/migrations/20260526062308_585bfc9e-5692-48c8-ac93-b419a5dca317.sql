
COMMENT ON FUNCTION public.register_intake_document(uuid, text, uuid, text, text, text, bigint, text, text, uuid) IS 'Registers uploaded intake document with versioning';
SELECT pg_notify('pgrst', 'reload schema');
