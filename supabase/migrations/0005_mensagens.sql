-- Mural de mensagens internas: qualquer usuário manda uma mensagem para todos
-- (sem destinatário/thread — feed único). Texto pode conter referências a
-- projetos/tarefas no formato @[Nome](proj:ID) ou @[Nome](tarefa:ID), inseridas
-- pelo autocomplete no cliente (ver src/app/mensagens/MensagensPage.tsx) e
-- resolvidas para um link clicável na hora de renderizar.
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_login TEXT NOT NULL,
  autor_nome TEXT NOT NULL,
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de "broadcast from database" do 0002_realtime_broadcast.sql,
-- em canal próprio (mensagens-sync) pra não disparar refetch do módulo de
-- projetos a cada mensagem nova.
CREATE OR REPLACE FUNCTION public.broadcast_mensagens_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', COALESCE(NEW.id, OLD.id)),
    'changed',
    'mensagens-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS broadcast_change ON public.mensagens;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.mensagens
FOR EACH ROW EXECUTE FUNCTION public.broadcast_mensagens_change();
