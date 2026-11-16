-- Executar no banco do projeto após a migração ranking_schema.
BEGIN;
LOCK TABLE auth.users IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION public.sync_ranking_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF lower(NEW.email) = 'ftvrankeado@gmail.com'
     AND NEW.email_confirmed_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = NEW.id AND role = 'owner';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_ranking_owner() FROM PUBLIC;

DROP TRIGGER IF EXISTS sync_ranking_owner ON auth.users;
CREATE TRIGGER sync_ranking_owner
AFTER INSERT OR UPDATE OF email, email_confirmed_at, deleted_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_ranking_owner();

DELETE FROM public.user_roles r WHERE r.role = 'owner' AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = r.user_id
    AND lower(u.email) = 'ftvrankeado@gmail.com'
    AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
);
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner' FROM auth.users WHERE lower(email) = 'ftvrankeado@gmail.com'
  AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
COMMIT;
