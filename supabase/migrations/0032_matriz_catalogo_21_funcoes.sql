-- Exclusão definitiva do catálogo numérico de 24 funções, solicitada em 21/10/2026.
-- Não converte respostas antigas por posição nem apaga respostas F01–F21.
-- Um bloco transacional mantém o bloqueio e restaura o gatilho em caso de falha.
DO $$
DECLARE definicao text;
BEGIN
  LOCK TABLE public.diagnostico_matriz IN ACCESS EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM public.diagnostico_matriz
    WHERE funcao_id !~ '^(F(0[1-9]|1[0-9]|2[01])|[1-9]|1[0-9]|2[0-4])$') THEN
    RAISE EXCEPTION 'Existem códigos desconhecidos na Matriz. Confira-os antes de limpar o catálogo antigo.';
  END IF;
  SELECT pg_get_constraintdef(oid) INTO definicao FROM pg_constraint
    WHERE conrelid='public.diagnostico_matriz'::regclass AND conname='diagnostico_matriz_funcao_21_ck';
  IF FOUND AND definicao <> 'CHECK ((funcao_id ~ ''^F(0[1-9]|1[0-9]|2[01])$''::text))' THEN
    RAISE EXCEPTION 'A restrição diagnostico_matriz_funcao_21_ck já existe com outra definição.';
  END IF;
  -- O gatilho de imutabilidade também protege exclusões de diagnósticos concluídos.
  -- Suspende somente este gatilho durante a limpeza autorizada, sob bloqueio exclusivo.
  ALTER TABLE public.diagnostico_matriz DISABLE TRIGGER diagnostico_editavel_guard;
  DELETE FROM public.diagnostico_matriz WHERE funcao_id ~ '^([1-9]|1[0-9]|2[0-4])$';
  ALTER TABLE public.diagnostico_matriz ENABLE TRIGGER diagnostico_editavel_guard;
  IF definicao IS NULL THEN
    ALTER TABLE public.diagnostico_matriz ADD CONSTRAINT diagnostico_matriz_funcao_21_ck
      CHECK (funcao_id ~ '^F(0[1-9]|1[0-9]|2[01])$');
  END IF;
END $$;
