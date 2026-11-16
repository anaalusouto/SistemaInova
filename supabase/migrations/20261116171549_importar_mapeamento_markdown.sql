-- Cada alteração é conferida novamente sob bloqueio; qualquer erro reverte o lote inteiro.
CREATE OR REPLACE FUNCTION public.importar_mapeamento_markdown(p_organizacao uuid,p_diagnostico uuid,p_autor text,p_alteracoes jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE estado text; a jsonb; q jsonb; anterior jsonb; resposta jsonb; dados_produto jsonb; operacao text; versao_atual integer; alvo uuid; v_codigo text; v_contexto text; linha public.diagnostico_matriz%ROWTYPE; total integer:=0;
BEGIN
  IF nullif(trim(p_autor),'') IS NULL OR jsonb_typeof(p_alteracoes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_alteracoes)>5000 THEN RAISE EXCEPTION 'Importação inválida.'; END IF;
  SELECT status INTO estado FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
  IF NOT FOUND OR estado<>'em_edicao' THEN RAISE EXCEPTION 'Organização ou mapeamento inválido, ou mapeamento concluído.'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_alteracoes) x WHERE x->>'tipo'='matriz') AND EXISTS (SELECT 1 FROM public.diagnostico_matriz_importacoes i WHERE i.diagnostico_id=p_diagnostico AND i.estado='pendente') THEN
    RAISE EXCEPTION 'Conclua ou descarte a conferência da importação da Matriz antes de continuar.';
  END IF;
  -- Portfólio antes das respostas de perfil/implantação, mantendo as regras do caderno.
  FOR a IN SELECT value FROM jsonb_array_elements(p_alteracoes) ORDER BY CASE WHEN value->>'tipo'='caderno' AND value->>'codigo' LIKE 'PR_%' THEN 0 WHEN value->>'tipo'='caderno' AND value->>'codigo' LIKE 'IM%' THEN 2 ELSE 1 END LOOP
    resposta:=a->'proposto';
    IF a->>'tipo'='matriz' THEN
      v_codigo:=a->>'codigo';
      SELECT * INTO linha FROM public.diagnostico_matriz WHERE diagnostico_id=p_diagnostico AND funcao_id=v_codigo FOR UPDATE;
      anterior:=jsonb_build_object('atuacao',linha.atuacao[1],'experiencia',linha.experiencia,'criticidade',linha.criticidade,'interesse',linha.interesse,'observacoes',linha.observacoes,'externo',linha.externo);
      IF anterior IS DISTINCT FROM a->'original' THEN RAISE EXCEPTION 'A função % da Matriz foi alterada após a exportação.',v_codigo; END IF;
      PERFORM public.salvar_matriz_prototipo(p_organizacao,p_diagnostico,v_codigo,a->>'nome',resposta->>'atuacao',resposta->>'experiencia',resposta->>'criticidade',resposta->>'interesse',resposta->>'observacoes',resposta->>'externo');
    ELSIF a->>'tipo'='caderno' THEN
      v_codigo:=a->>'codigo'; v_contexto:=a->>'contexto';
      SELECT r.resposta,r.versao INTO anterior,versao_atual FROM public.diagnostico_caderno_respostas r WHERE r.diagnostico_id=p_diagnostico AND r.codigo=v_codigo AND r.contexto=v_contexto FOR UPDATE;
      anterior:=coalesce(anterior,'{"valor":null,"selecoes":[],"relato":"","fonte":"","respondentes":""}'::jsonb);
      IF anterior IS DISTINCT FROM a->'original' THEN RAISE EXCEPTION 'A resposta % foi alterada após a exportação.',v_codigo; END IF;
      PERFORM public.salvar_resposta_caderno_cria(p_organizacao,p_diagnostico,v_codigo,v_contexto,resposta,coalesce(versao_atual,0),p_autor);
    ELSIF a->>'tipo'='categoria' THEN
      alvo:=(a->>'id')::uuid;
      SELECT jsonb_build_object('nome',nome) INTO anterior FROM public.diagnostico_cesta_categorias WHERE id=alvo AND diagnostico_id=p_diagnostico FOR UPDATE;
      IF anterior IS NULL OR anterior IS DISTINCT FROM a->'original' THEN RAISE EXCEPTION 'A categoria foi alterada após a exportação.'; END IF;
      UPDATE public.diagnostico_cesta_categorias SET nome=trim(resposta->>'nome') WHERE id=alvo AND diagnostico_id=p_diagnostico;
    ELSIF a->>'tipo'='novo_produto' THEN
      dados_produto:=resposta->'dados';
      INSERT INTO public.diagnostico_produtos(diagnostico_id,nome,cadeia,categoria_id,unidade_medida,safra,canais_comerciais,etapas_economicas)
        VALUES(p_diagnostico,trim(dados_produto->>'nome'),dados_produto->>'cadeia',(dados_produto->>'categoriaId')::uuid,dados_produto->>'unidadeMedida',dados_produto->'safra',dados_produto->'canaisComerciais',dados_produto->'etapasEconomicas') RETURNING id INTO alvo;
      SELECT x->'resposta'->>'valor' INTO operacao FROM jsonb_array_elements(resposta->'perguntas') x WHERE x->>'codigo'='PR_OPERACAO';
      FOR q IN SELECT value FROM jsonb_array_elements(resposta->'perguntas') ORDER BY CASE WHEN value->>'codigo' LIKE 'PR_%' THEN 0 WHEN value->>'codigo' LIKE 'IM%' THEN 2 ELSE 1 END LOOP
        v_codigo:=q->>'codigo'; anterior:=q->'resposta';
        IF anterior->>'valor' IS NULL AND anterior->'selecoes'='[]'::jsonb AND coalesce(anterior->>'relato','')='' AND coalesce(anterior->>'fonte','')='' AND coalesce(anterior->>'respondentes','')='' THEN CONTINUE; END IF;
        v_contexto:=CASE WHEN v_codigo LIKE 'IM%' THEN operacao ELSE alvo::text END;
        PERFORM public.salvar_resposta_caderno_cria(p_organizacao,p_diagnostico,v_codigo,v_contexto,anterior,0,p_autor);
      END LOOP;
    ELSIF a->>'tipo'='produto' THEN
      alvo:=(a->>'id')::uuid;
      SELECT jsonb_build_object('nome',nome,'cadeia',cadeia,'categoriaId',categoria_id,'unidadeMedida',unidade_medida,'safra',safra,'canaisComerciais',canais_comerciais,'etapasEconomicas',etapas_economicas)
      INTO anterior FROM public.diagnostico_produtos WHERE id=alvo AND diagnostico_id=p_diagnostico FOR UPDATE;
      IF anterior IS NULL OR anterior IS DISTINCT FROM a->'original' THEN RAISE EXCEPTION 'O produto foi alterado após a exportação.'; END IF;
      UPDATE public.diagnostico_produtos SET nome=trim(resposta->>'nome'),cadeia=resposta->>'cadeia',categoria_id=(resposta->>'categoriaId')::uuid,unidade_medida=resposta->>'unidadeMedida',safra=resposta->'safra',canais_comerciais=resposta->'canaisComerciais',etapas_economicas=resposta->'etapasEconomicas',atualizado_em=now() WHERE id=alvo AND diagnostico_id=p_diagnostico;
    ELSE RAISE EXCEPTION 'Tipo de registro não permitido.';
    END IF;
    total:=total+1;
  END LOOP;
  UPDATE public.diagnosticos SET atualizado_em=now() WHERE id=p_diagnostico;
  RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.importar_mapeamento_markdown(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.importar_mapeamento_markdown(uuid,uuid,text,jsonb) TO service_role;
