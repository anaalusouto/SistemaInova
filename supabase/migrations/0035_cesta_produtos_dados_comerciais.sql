-- Cesta de Produtos: categoria e dados próprios de comercialização/safra.
-- Não converte respostas antigas nem confunde categoria com operação PR/OP.
CREATE TABLE IF NOT EXISTS public.diagnostico_cesta_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  nome text NOT NULL CHECK (btrim(nome) <> ''),
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (diagnostico_id, nome),
  UNIQUE (id, diagnostico_id)
);
ALTER TABLE public.diagnostico_cesta_categorias ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diagnostico_cesta_categorias FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostico_cesta_categorias TO service_role;

ALTER TABLE public.diagnostico_produtos
  ADD COLUMN IF NOT EXISTS categoria_id uuid,
  ADD COLUMN IF NOT EXISTS unidade_medida text,
  ADD COLUMN IF NOT EXISTS safra jsonb NOT NULL DEFAULT '{"estado":"nao_informada","intervalos":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS canais_comerciais jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS etapas_economicas jsonb NOT NULL DEFAULT '[]'::jsonb;

-- A categoria deve pertencer à mesma aplicação do produto.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.diagnostico_produtos'::regclass AND conname='diagnostico_produtos_categoria_mesmo_diagnostico_fk') THEN
    ALTER TABLE public.diagnostico_produtos
      ADD CONSTRAINT diagnostico_produtos_categoria_mesmo_diagnostico_fk
      FOREIGN KEY (categoria_id, diagnostico_id)
      REFERENCES public.diagnostico_cesta_categorias(id, diagnostico_id) ON DELETE SET NULL (categoria_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.diagnostico_produtos'::regclass AND conname='diagnostico_produtos_cesta_json_ck') THEN
    ALTER TABLE public.diagnostico_produtos ADD CONSTRAINT diagnostico_produtos_cesta_json_ck CHECK (
      jsonb_typeof(safra)='object' AND safra ?& ARRAY['estado','intervalos']
      AND safra->>'estado' IN ('nao_informada','ano_inteiro','sazonal')
      AND jsonb_typeof(safra->'intervalos')='array'
      AND jsonb_typeof(canais_comerciais)='array'
      AND jsonb_typeof(etapas_economicas)='array'
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS diagnostico_cesta_categoria_idx ON public.diagnostico_cesta_categorias(diagnostico_id,nome);
CREATE INDEX IF NOT EXISTS diagnostico_produtos_categoria_idx ON public.diagnostico_produtos(categoria_id) WHERE categoria_id IS NOT NULL;
GRANT SELECT, UPDATE ON public.diagnostico_produtos TO service_role;

COMMENT ON TABLE public.diagnostico_cesta_categorias IS 'Categorias do portfólio; independentes de operação e grupo responsável.';
COMMENT ON COLUMN public.diagnostico_produtos.safra IS 'estado distingue não informada, ano inteiro e sazonal; intervalos aceitam safra atravessando dezembro.';
COMMENT ON COLUMN public.diagnostico_produtos.canais_comerciais IS 'Condições por canal e período de referência; valores ausentes permanecem nulos.';
COMMENT ON COLUMN public.diagnostico_produtos.etapas_economicas IS 'Retrato econômico por etapa, sem controle financeiro ou conciliação.';
