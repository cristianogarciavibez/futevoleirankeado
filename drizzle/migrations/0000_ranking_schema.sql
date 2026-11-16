CREATE TYPE public.app_role AS ENUM ('owner','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('owner','admin'))
$$;

CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.athletes TO anon, authenticated;
GRANT INSERT, UPDATE ON public.athletes TO authenticated;
GRANT ALL ON public.athletes TO service_role;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes public read" ON public.athletes FOR SELECT USING (true);
CREATE POLICY "admins insert athletes" ON public.athletes FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins update athletes" ON public.athletes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  played_on date NOT NULL,
  season text NOT NULL,
  a1 uuid NOT NULL REFERENCES public.athletes(id),
  a2 uuid NOT NULL REFERENCES public.athletes(id),
  b1 uuid NOT NULL REFERENCES public.athletes(id),
  b2 uuid NOT NULL REFERENCES public.athletes(id),
  score_a int NOT NULL CHECK (score_a >= 0),
  score_b int NOT NULL CHECK (score_b >= 0),
  doubled boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (score_a <> score_b)
);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches public read" ON public.matches FOR SELECT USING (true);

CREATE TABLE public.match_points (
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.athletes(id),
  season text NOT NULL,
  points int NOT NULL,
  won boolean NOT NULL,
  PRIMARY KEY (match_id, athlete_id)
);
GRANT SELECT ON public.match_points TO anon, authenticated;
GRANT ALL ON public.match_points TO service_role;
ALTER TABLE public.match_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "points public read" ON public.match_points FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.match_points_for(_winner_score int, _loser_score int, _doubled boolean)
RETURNS TABLE(win_pts int, lose_pts int) LANGUAGE sql IMMUTABLE AS $$
  SELECT (1 * CASE WHEN _doubled THEN 2 ELSE 1 END),
         ((CASE WHEN _loser_score >= 11 THEN -1 ELSE -2 END) * CASE WHEN _doubled THEN 2 ELSE 1 END)
$$;

CREATE OR REPLACE FUNCTION public.add_match(
  _request_id uuid, _played_on date, _a1 uuid, _a2 uuid, _b1 uuid, _b2 uuid,
  _score_a int, _score_b int, _doubled boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _id uuid; _season text; _wp int; _lp int; _a_won boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO _id FROM public.matches WHERE request_id = _request_id;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(ARRAY[_a1,_a2,_b1,_b2]) x) <> 4 THEN
    RAISE EXCEPTION 'Escolha quatro atletas diferentes';
  END IF;
  IF (SELECT count(*) FROM public.athletes WHERE id IN (_a1,_a2,_b1,_b2) AND active) <> 4 THEN
    RAISE EXCEPTION 'Todos os atletas devem estar ativos';
  END IF;
  IF _score_a IS NULL OR _score_b IS NULL OR _score_a < 0 OR _score_b < 0 THEN
    RAISE EXCEPTION 'Placar inválido';
  END IF;
  IF _score_a = _score_b THEN RAISE EXCEPTION 'Não existe empate'; END IF;
  _season := to_char(_played_on, 'YY') || '.' || CASE WHEN extract(month FROM _played_on) <= 6 THEN '1' ELSE '2' END;
  _a_won := _score_a > _score_b;
  SELECT win_pts, lose_pts INTO _wp, _lp FROM public.match_points_for(greatest(_score_a,_score_b), least(_score_a,_score_b), _doubled);
  INSERT INTO public.matches(request_id, played_on, season, a1,a2,b1,b2, score_a, score_b, doubled, created_by)
  VALUES (_request_id, _played_on, _season, _a1,_a2,_b1,_b2, _score_a, _score_b, coalesce(_doubled,false), auth.uid())
  ON CONFLICT (request_id) DO NOTHING
  RETURNING id INTO _id;
  IF _id IS NULL THEN
    SELECT id INTO _id FROM public.matches WHERE request_id = _request_id; RETURN _id;
  END IF;
  INSERT INTO public.match_points(match_id, athlete_id, season, points, won) VALUES
    (_id, _a1, _season, CASE WHEN _a_won THEN _wp ELSE _lp END, _a_won),
    (_id, _a2, _season, CASE WHEN _a_won THEN _wp ELSE _lp END, _a_won),
    (_id, _b1, _season, CASE WHEN _a_won THEN _lp ELSE _wp END, NOT _a_won),
    (_id, _b2, _season, CASE WHEN _a_won THEN _lp ELSE _wp END, NOT _a_won);
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.add_match FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_match TO authenticated;

CREATE OR REPLACE VIEW public.season_ranking WITH (security_invoker = true) AS
SELECT mp.season, a.id AS athlete_id, a.name, a.active,
  sum(mp.points)::int AS points, count(*)::int AS games,
  count(*) FILTER (WHERE mp.won)::int AS wins
FROM public.match_points mp JOIN public.athletes a ON a.id = mp.athlete_id
GROUP BY mp.season, a.id, a.name, a.active;
GRANT SELECT ON public.season_ranking TO anon, authenticated;

-- Admin management (owner only)
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(user_id uuid, email text, role public.app_role)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Apenas o dono' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT r.user_id, u.email::text, r.role FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id ORDER BY r.role, u.email;
END $$;
CREATE OR REPLACE FUNCTION public.grant_admin(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Apenas o dono' USING ERRCODE='42501'; END IF;
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF _uid IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado. Crie a conta primeiro.'; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.revoke_admin(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Apenas o dono' USING ERRCODE='42501'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
END $$;
REVOKE EXECUTE ON FUNCTION public.list_admins, public.grant_admin, public.revoke_admin FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admins, public.grant_admin, public.revoke_admin TO authenticated;
