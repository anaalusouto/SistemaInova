-- Quadro de gestão interna (estilo Trello): colunas por pessoa (usuários), com
-- tarefas de gestão próprias — independentes das atividades do plano de trabalho
-- (public.atividades) e das atribuições nascidas de menções no mural
-- (public.mensagem_atribuicoes, ver 0007). Aqui a tarefa tem vida própria: título,
-- prioridade e pode referenciar mais de um projeto ao mesmo tempo.
CREATE TABLE IF NOT EXISTS public.tarefas_gestao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  atribuido_para_login TEXT NOT NULL,
  atribuido_para_nome TEXT NOT NULL,
  atribuido_por_login TEXT NOT NULL,
  atribuido_por_nome TEXT NOT NULL,
  data_entrada DATE NOT NULL,
  data_limite DATE NOT NULL,
  criticidade SMALLINT NOT NULL DEFAULT 0 CHECK (criticidade BETWEEN 0 AND 10),
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
  concluida_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_tarefas_gestao_para ON public.tarefas_gestao(atribuido_para_login);
ALTER TABLE public.tarefas_gestao ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_tarefas_gestao_updated_at ON public.tarefas_gestao;
CREATE TRIGGER set_tarefas_gestao_updated_at BEFORE UPDATE ON public.tarefas_gestao
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Vínculo N:N com projetos (uma tarefa de gestão pode tocar mais de um projeto).
CREATE TABLE IF NOT EXISTS public.tarefas_gestao_projetos (
  tarefa_id UUID NOT NULL REFERENCES public.tarefas_gestao(id) ON DELETE CASCADE,
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  PRIMARY KEY (tarefa_id, projeto_id)
);
CREATE INDEX IF NOT EXISTS idx_tarefas_gestao_projetos_projeto ON public.tarefas_gestao_projetos(projeto_id);
ALTER TABLE public.tarefas_gestao_projetos ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de "broadcast from database" do 0002/0005/0007, em canal próprio
-- (tarefas-gestao-sync) pra não disparar refetch de mensagens/projetos/agenda.
CREATE OR REPLACE FUNCTION public.broadcast_tarefas_gestao_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', COALESCE(NEW.id, OLD.id)),
    'changed',
    'tarefas-gestao-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS broadcast_change ON public.tarefas_gestao;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.tarefas_gestao
FOR EACH ROW EXECUTE FUNCTION public.broadcast_tarefas_gestao_change();

-- A junção não tem coluna "id" (chave composta tarefa_id+projeto_id), então usa
-- uma função de broadcast própria — reusar broadcast_tarefas_gestao_change() aqui
-- quebraria com "record new has no field id".
CREATE OR REPLACE FUNCTION public.broadcast_tarefas_gestao_projetos_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'tarefa_id', COALESCE(NEW.tarefa_id, OLD.tarefa_id)),
    'changed',
    'tarefas-gestao-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- A junção não tem coluna própria de conteúdo (só chaves) — o realtime da tarefa
-- pai já cobre "algo mudou nessa tarefa" o suficiente para o cliente invalidar e
-- refazer o SELECT com o join. Ainda assim, disparamos no mesmo canal para o caso
-- de a lista de projetos mudar sem nenhum outro campo de tarefas_gestao mudar.
DROP TRIGGER IF EXISTS broadcast_change ON public.tarefas_gestao_projetos;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.tarefas_gestao_projetos
FOR EACH ROW EXECUTE FUNCTION public.broadcast_tarefas_gestao_projetos_change();
