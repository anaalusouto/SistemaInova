-- ==============================================================================
-- 0014 — Título dos riscos (RF03) e notas da organização (Anotações, opção 1)
--
-- Idempotente: pode rodar mais de uma vez.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Título dos riscos migrados (RF03)
--
-- A 0011 preencheu `titulo` com `especificacao_legado` — na planilha antiga,
-- a atividade ou especificação a que o risco se referia, e não o risco. Por
-- isso a coluna Risco mostrava o nome de uma atividade ("Assinatura do
-- contrato") em vez do risco ("Atraso na assinatura pode gerar atraso…").
--
-- O título passa a ser o início da descrição: até 120 caracteres, sem partir
-- palavra, com reticências quando corta. A descrição inteira não muda, e a
-- especificação continua em `especificacao`, onde já estava.
--
-- Só troca o título que ainda é cópia exata da especificação legada: título
-- que alguém editou pelo formulário é deixado como está.
-- ------------------------------------------------------------------------------
UPDATE public.plano_riscos
   SET titulo = CASE
         WHEN char_length(btrim(descricao)) <= 120 THEN btrim(descricao)
         -- O corte cai num espaço: a 120ª letra já fecha uma palavra.
         WHEN substr(btrim(descricao), 121, 1) ~ '\s' THEN rtrim(left(btrim(descricao), 120), ' ,;:') || '…'
         -- Senão, recua até o fim da última palavra inteira.
         ELSE rtrim(regexp_replace(left(btrim(descricao), 120), '\s+\S*$', ''), ' ,;:') || '…'
       END
 WHERE btrim(COALESCE(especificacao_legado, '')) <> ''
   AND btrim(titulo) = btrim(especificacao_legado)
   AND btrim(COALESCE(descricao, '')) <> '';

-- ------------------------------------------------------------------------------
-- 2. Notas da organização
--
-- Um bloco por organização, compartilhado pela equipe. `versao` serve para
-- detectar duas pessoas salvando ao mesmo tempo: a gravação exige a versão
-- que a pessoa tinha aberto e, se outra pessoa salvou antes, recusa em vez de
-- apagar em silêncio o texto dela.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizacao_notas (
  comunidade_id UUID PRIMARY KEY REFERENCES public.comunidades(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL DEFAULT '',
  versao INTEGER NOT NULL DEFAULT 1,
  atualizado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.organizacao_notas ENABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS set_organizacao_notas_updated_at ON public.organizacao_notas;
CREATE TRIGGER set_organizacao_notas_updated_at BEFORE UPDATE ON public.organizacao_notas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- A função de broadcast da 0002 lê NEW.id; esta tabela não tem `id`. Função
-- própria, mesmo canal e mesmo formato de aviso.
CREATE OR REPLACE FUNCTION public.broadcast_organizacao_notas_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', COALESCE(NEW.comunidade_id, OLD.comunidade_id)),
    'changed',
    'projetos-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS broadcast_change ON public.organizacao_notas;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.organizacao_notas
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_organizacao_notas_change();
