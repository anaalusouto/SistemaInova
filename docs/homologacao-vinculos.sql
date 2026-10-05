-- Consulta somente leitura. Executar no ambiente de homologação e guardar
-- ambiente, versão, data, verificador e saída junto à matriz de evidências.
-- Não concilia, exclui ou escolhe projetos automaticamente.
SELECT c.id AS organizacao_id, c.code AS codigo, c.nome,
       count(p.id) AS quantidade_projetos,
       array_agg(p.id ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL) AS projetos_ids,
       CASE WHEN count(p.id) = 0 THEN 'sem projeto'
            WHEN count(p.id) = 1 THEN 'vinculo unico'
            ELSE 'conflito: corrigir vinculos' END AS resultado
FROM public.comunidades c
LEFT JOIN public.projetos p ON p.comunidade_id = c.id
GROUP BY c.id, c.code, c.nome
ORDER BY c.nome, c.id;

-- A presença do índice deve ser verificada; arquivo de migração não comprova
-- que ele foi aplicado ao ambiente. A migração 0018 falha se houver conflitos.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'projetos'
  AND indexname = 'idx_projetos_organizacao_unica';
