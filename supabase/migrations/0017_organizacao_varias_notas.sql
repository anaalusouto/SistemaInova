-- ==============================================================================
-- 0017 — Várias notas por organização (UI/UX, 29/09/2026)
--
-- A 0014 criou UMA nota compartilhada por organização (a chave primária era
-- `comunidade_id`). A equipe decidiu por várias notas, cada uma um post-it,
-- com o botão "Nova nota". A tabela passa a ter `id` próprio; a nota que cada
-- organização já tem vira a primeira da lista, sem perder texto nem versão.
--
-- O controle de versão continua POR NOTA (`versao`): duas pessoas editando a
-- mesma nota ao mesmo tempo ainda não apagam o texto uma da outra.
--
-- Idempotente: pode rodar mais de uma vez.
-- ==============================================================================

ALTER TABLE public.organizacao_notas ADD COLUMN IF NOT EXISTS id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.organizacao_notas ADD COLUMN IF NOT EXISTS criado_por TEXT;
UPDATE public.organizacao_notas SET criado_por = atualizado_por WHERE criado_por IS NULL;

-- Troca a chave primária de comunidade_id para id (só se ainda não trocou).
DO $$
DECLARE pk text;
BEGIN
  SELECT c.conname INTO pk
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
   WHERE c.conrelid = 'public.organizacao_notas'::regclass
     AND c.contype = 'p'
     AND a.attname = 'comunidade_id';
  IF pk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.organizacao_notas DROP CONSTRAINT %I', pk);
    ALTER TABLE public.organizacao_notas ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizacao_notas_comunidade
  ON public.organizacao_notas(comunidade_id, criado_em DESC);

-- Nota vazia que sobrou do modelo antigo (o bloco era criado vazio ao salvar
-- sem texto) não vira post-it em branco na lista nova.
DELETE FROM public.organizacao_notas WHERE btrim(conteudo) = '';

-- Realtime: o trigger e a função da 0014 continuam valendo (avisam pelo
-- comunidade_id, que é o que a tela usa para recarregar a ficha).
