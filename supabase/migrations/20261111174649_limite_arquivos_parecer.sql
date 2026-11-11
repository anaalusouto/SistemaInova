-- Amplia apenas pareceres da organização; documentos existentes não são alterados.
DO $$
DECLARE
  limite_antigo text;
  limite_novo text;
  definicao_nova constant text := 'CHECK (((tamanho_bytes > 0) AND ((tamanho_bytes <= 3145728) OR ((area = ''parecer''::text) AND (tamanho_bytes <= 20971520)))))';
BEGIN
  SELECT pg_get_constraintdef(oid) INTO limite_antigo FROM pg_constraint
    WHERE conrelid = 'public.documentos_registro'::regclass AND conname = 'documentos_registro_tamanho_bytes_check' AND contype = 'c';
  SELECT pg_get_constraintdef(oid) INTO limite_novo FROM pg_constraint
    WHERE conrelid = 'public.documentos_registro'::regclass AND conname = 'documentos_registro_limite_area_ck' AND contype = 'c';

  IF limite_antigo IS NOT NULL AND limite_antigo <> 'CHECK (((tamanho_bytes > 0) AND (tamanho_bytes <= 3145728)))' THEN
    RAISE EXCEPTION 'Limite existente de documentos é incompatível; nenhuma alteração foi aplicada.';
  END IF;
  IF limite_novo IS NOT NULL AND limite_novo <> definicao_nova THEN
    RAISE EXCEPTION 'Limite por área já existe com definição incompatível; nenhuma alteração foi aplicada.';
  END IF;
  IF limite_antigo IS NULL AND limite_novo IS NULL THEN
    RAISE EXCEPTION 'Limite de documentos esperado não encontrado; nenhuma alteração foi aplicada.';
  END IF;
  IF limite_novo IS NULL THEN
    ALTER TABLE public.documentos_registro ADD CONSTRAINT documentos_registro_limite_area_ck
      CHECK (tamanho_bytes > 0 AND (tamanho_bytes <= 3145728 OR (area = 'parecer' AND tamanho_bytes <= 20971520)));
  END IF;
  IF limite_antigo IS NOT NULL THEN
    ALTER TABLE public.documentos_registro DROP CONSTRAINT documentos_registro_tamanho_bytes_check;
  END IF;
END $$;
