-- ==============================================================================
-- Realtime "broadcast from database": qualquer INSERT/UPDATE/DELETE nas tabelas
-- do módulo Projetos dispara um aviso (canal "projetos-sync") pra quem estiver
-- com a tela aberta, que então busca os dados de novo via server function
-- (não via realtime direto — RLS continua bloqueado pro anon; o broadcast só
-- avisa "algo mudou", nunca manda o conteúdo da linha, pra não vazar dado
-- sensível pela chave pública).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.broadcast_projetos_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object('table', TG_TABLE_NAME, 'op', TG_OP, 'id', COALESCE(NEW.id, OLD.id)),
    'changed',
    'projetos-sync',
    false
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'projetos', 'projeto_equipe', 'metas', 'entregas', 'atividades',
    'plano_riscos', 'mudancas', 'orcamento_itens', 'orcamento_contrapartidas',
    'evidencias', 'aportes', 'contatos', 'logs_comunicacao',
    'log_alteracoes_meta', 'aprovacoes_pendentes'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS broadcast_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.broadcast_projetos_change()', t
    );
  END LOOP;
END $$;
