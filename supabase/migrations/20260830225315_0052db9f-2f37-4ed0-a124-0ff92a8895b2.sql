REVOKE EXECUTE ON FUNCTION public.generate_application_code(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_application_defaults() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_application_token(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_application_sections(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_application_sections(uuid) TO authenticated;