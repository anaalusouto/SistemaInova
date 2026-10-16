-- Uma referência compartilhada; cada importação/correção cria snapshot imutável.
CREATE TABLE public.cronograma_rotas (
  id text PRIMARY KEY CHECK (id = 'principal'),
  versao bigint NOT NULL CHECK (versao > 0),
  dados jsonb NOT NULL CHECK (jsonb_typeof(dados) = 'object'),
  autor text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cronograma_rotas_historico (
  versao bigint PRIMARY KEY,
  dados jsonb NOT NULL,
  autor text NOT NULL,
  motivo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cronograma_rotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronograma_rotas_historico ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cronograma_rotas, public.cronograma_rotas_historico FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cronograma_rotas TO service_role;
GRANT SELECT, INSERT ON public.cronograma_rotas_historico TO service_role;

CREATE FUNCTION public.salvar_cronograma_rotas(p_versao bigint, p_dados jsonb, p_autor text, p_motivo text)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE atual bigint; nova bigint;
BEGIN
  IF p_versao IS NULL OR p_versao < 0 OR p_dados IS NULL OR
     jsonb_typeof(p_dados) IS DISTINCT FROM 'object' OR
     p_dados->>'schema' IS DISTINCT FROM '1' OR
     jsonb_typeof(p_dados->'abas') IS DISTINCT FROM 'array' OR
     octet_length(p_dados::text) > 3000000 OR
     nullif(trim(p_autor),'') IS NULL OR nullif(trim(p_motivo),'') IS NULL THEN
    RAISE EXCEPTION 'Dados do cronograma inválidos.';
  END IF;
  -- Serializa inclusive a primeira importação, quando a linha ainda não existe.
  PERFORM pg_advisory_xact_lock(hashtext('inova:cronograma_rotas:principal'));
  SELECT versao INTO atual FROM public.cronograma_rotas WHERE id='principal' FOR UPDATE;
  IF coalesce(atual,0) <> p_versao THEN
    RAISE EXCEPTION 'O cronograma foi alterado por outra pessoa. Recarregue antes de salvar.';
  END IF;
  nova := p_versao + 1;
  INSERT INTO public.cronograma_rotas(id,versao,dados,autor) VALUES('principal',nova,p_dados,p_autor)
    ON CONFLICT(id) DO UPDATE SET versao=EXCLUDED.versao,dados=EXCLUDED.dados,autor=EXCLUDED.autor,atualizado_em=clock_timestamp();
  INSERT INTO public.cronograma_rotas_historico(versao,dados,autor,motivo) VALUES(nova,p_dados,p_autor,p_motivo);
  RETURN nova;
END $$;
REVOKE ALL ON FUNCTION public.salvar_cronograma_rotas(bigint,jsonb,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_cronograma_rotas(bigint,jsonb,text,text) TO service_role;
