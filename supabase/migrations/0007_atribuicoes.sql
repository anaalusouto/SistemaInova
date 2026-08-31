-- Atribuições de tarefa feitas dentro de uma mensagem: quando o autor menciona
-- uma tarefa (@[Nome](tarefa:id)) e uma pessoa (@[Nome](pessoa:login)) na mesma
-- mensagem, o cliente registra um vínculo aqui (ver extractAssignments em
-- src/app/mensagens/mentionUtils.tsx). Isso alimenta a Agenda (src/app/agenda) —
-- uma lista pessoal do que foi atribuído a cada um, sem duplicar/alterar o
-- responsável (texto livre) já existente em atividades.responsavel.
CREATE TABLE IF NOT EXISTS public.mensagem_atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id UUID NOT NULL REFERENCES public.mensagens(id) ON DELETE CASCADE,
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  atribuido_para_login TEXT NOT NULL,
  atribuido_para_nome TEXT NOT NULL,
  atribuido_por_login TEXT NOT NULL,
  atribuido_por_nome TEXT NOT NULL,
  -- Concluída aqui é só o "check" pessoal na Agenda — não mexe no status real
  -- da atividade (que continua sendo editado normalmente na aba do projeto).
  concluida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_para ON public.mensagem_atribuicoes(atribuido_para_login);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_por ON public.mensagem_atribuicoes(atribuido_por_login);
CREATE INDEX IF NOT EXISTS idx_atribuicoes_atividade ON public.mensagem_atribuicoes(atividade_id);
ALTER TABLE public.mensagem_atribuicoes ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de "broadcast from database" do 0002/0005, em canal próprio
-- (atribuicoes-sync) pra não disparar refetch de mensagens/projetos.
CREATE OR REPLACE FUNCTION public.broadcast_atribuicoes_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', COALESCE(NEW.id, OLD.id)),
    'changed',
    'atribuicoes-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS broadcast_change ON public.mensagem_atribuicoes;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.mensagem_atribuicoes
FOR EACH ROW EXECUTE FUNCTION public.broadcast_atribuicoes_change();
