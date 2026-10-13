# Plano de trabalho e riscos — REQ-01 a REQ-06

## Mapeamento de campos de negócio

A leitura em `projetos.server.ts` converte o schema para os modelos da aplicação. `planoRelatorio.ts` mapeia esses modelos para registros com rótulo, valor e indicação de preenchimento. A visão completa, a impressão do relatório e as exportações PDF, CSV e XML usam esse mesmo mapeamento.

| Registro | Campos no banco | Campos no modelo / relatório |
| --- | --- | --- |
| Meta | nome, responsavel, inicio_previsto, fim_previsto | name, responsible, plannedStart, plannedEnd |
| Etapa | nome, resultado_esperado, inicio_previsto, fim_previsto, inicio_realizado, fim_realizado | name, expectedResult, plannedStart, plannedEnd, actualStart, actualEnd |
| Atividade | nome, responsavel, status, progresso | name, responsible, status, progress |
| Atividade: datas | inicio_previsto, fim_previsto, inicio_realizado, fim_realizado, justificativa_atraso | plannedStart, plannedEnd, actualStart, actualEnd, delayJustification |
| Atividade: complementos | vinculo_orcamentario, observacoes, risco_origem_id; projeto_anexos.nome_arquivo | budgetLink, observations, riskOriginId (nome do risco), attachment (nome do arquivo) |
| Acompanhamento | proximo_passo, proximo_passo_responsavel, proximo_passo_prazo | nextStep, nextStepOwner, nextStepDue |
| Subtarefa | tarefas.titulo, atividade_id, ordem | title, vínculo hierárquico com a atividade e sequência |
| Risco | titulo, descricao, etapa_id, meta_id, especificacao | title, description, stageId/goalId (nomes), specification |
| Risco: classificação | categoria, probabilidade, impacto, severidade, status, responsavel | category, probability, impact, severity, status, responsible |
| Risco: resposta | estrategia_mitigacao; atividades.risco_origem_id | responseStrategy e nomes das atividades de resposta |
| Parecer | data, origem, autor, pontos_observados, itens_criticos, limitacoes_orcamentarias, recomendacao, log_comunicacao_id | data, origem, autor, pontosObservados, itensCriticos, limitacoesOrcamentarias, recomendacao, registro de contato |

Campos vazios aparecem como “Não informado”; zero é um valor preenchido. IDs de vínculo são resolvidos para nomes quando disponíveis. Riscos legados preservam o nome da etapa e a especificação antiga como alternativa. O arquivo anexado é identificado pelo nome, sem incorporar seu conteúdo binário ao parecer.

## Decisões e comportamento

- REQ-01: exportação completa das seções escolhidas; botão “Exportar parecer” no plano inclui cadastro, plano, riscos e pareceres técnicos registrados.
- REQ-02: visão “Todos os campos” permite reordenar os campos por tipo de registro. A ordem vale durante a sessão da tela e é aplicada ao PDF exportado por ela. As demais visões seguem seus layouts próprios.
- REQ-03: hierarquia preservada: Meta → Etapa → Atividade → Subtarefa. Ação é o próximo passo de acompanhamento. Subtarefas suportam Enter, bloqueiam submissões simultâneas e preservam o rascunho em caso de falha.
- REQ-04: próximos passos aparecem automaticamente em Encaminhamentos da organização vinculada como projeção das atividades. Sua edição abre a fonte original. Status acompanha o da atividade; não existe estado independente de conclusão da ação. Pendências entram nos contadores da organização.
- REQ-05: atalhos no plano e no painel da atividade abrem Encaminhamentos; quando há próximo passo, a linha correspondente recebe foco e destaque.
- REQ-06: índice `ordem` crescente, com desempate permanente por ID em todos os níveis. Inclusões normais usam máximo + 1. Edições não recalculam índices. Falhas ao consultar índices impedem a inclusão. Inserções intermediárias sem intervalo numérico disponível são recusadas com orientação para adicionar ao final.

## Ordenação manual de metas, etapas e atividades

A visão “Ordenar” permite escolher diretamente a posição entre irmãos. Uma atividade pode passar de `1.2.2` para `1.2.4`; as atividades intermediárias mudam de posição e a numeração é recalculada. Mover uma meta ou etapa muda também o prefixo numérico de seus descendentes. Os IDs e os vínculos hierárquicos permanecem os mesmos.

Cada mudança é persistida pela RPC `reordenar_plano`, introduzida na migração `0021_reordenacao_plano.sql`. A função valida a lista completa de irmãos e o estado anterior, bloqueia os registros envolvidos, reatribui índices inteiros de 1 a N e registra o histórico na mesma transação. Uma falha desfaz toda a operação. Alterações concorrentes exigem atualizar a lista; o cliente atualiza os dados também após uma recusa. A função só pode ser executada pelo serviço do servidor, depois de validar a sessão com permissão de escrita.

A migração deve ser aplicada no ambiente antes de utilizar os controles. Ela cria a função e suas permissões; não reordena registros existentes ao ser instalada.

## Verificação

`tests/planoRelatorio.test.cjs` cobre conteúdos nas três exportações, campos vazios/zero, ordem de campos, isolamento por organização, atualização na fonte, estabilidade das etapas, contadores e submissão repetida de subtarefas. Os testes usam dados isolados e não alteram registros reais.

`tests/reordenacaoPlano.test.cjs` verifica mudança de posição, renumeração dos descendentes, preservação dos vínculos, validação do handler e controles por permissão. `node scripts/testarReordenacaoSql.mjs` executa a migração em PostgreSQL isolado em memória (PGlite) e verifica os três níveis, índices legados repetidos, conflitos, IDs duplicados, isolamento de origem, histórico, permissões e reversão integral quando o histórico falha. O comando de instalação da dependência temporária está no cabeçalho do script; não altera as dependências da aplicação.
