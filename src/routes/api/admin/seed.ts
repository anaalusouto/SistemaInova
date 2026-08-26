import { createFileRoute } from '@tanstack/react-router';
import { comunidades } from '@/app/data/comunidades';
import { inovaProjetos } from '@/app/data/inovaProjetos';
import { metasProjetos } from '@/app/data/metasProjetos';
import { riscosProjetos } from '@/app/data/riscosProjetos';

/** Correções de valores aprovados informadas pela coordenação (ver store.tsx histórico). */
const BUDGET_FIX: Record<string, number> = {
  ATAIC: 164198.0,
  ARQUIA: 200000.0,
  AMIG: 164244.4,
  COOPAFS: 164285.71,
};

export const Route = createFileRoute('/api/admin/seed')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.SEED_TOKEN;
        if (!expected) {
          return Response.json(
            { ok: false, error: 'SEED_TOKEN não configurado no ambiente do servidor.' },
            { status: 500 },
          );
        }
        const token = new URL(request.url).searchParams.get('token');
        if (token !== expected) {
          return Response.json({ ok: false, error: 'Token inválido ou ausente.' }, { status: 401 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const summary: Record<string, number> = {
          comunidades: 0, projetos: 0, metas: 0, entregas: 0, atividades: 0, riscos: 0,
        };

        try {
          const { count, error: countError } = await supabaseAdmin
            .from('projetos')
            .select('*', { count: 'exact', head: true });
          if (countError) throw countError;
          if ((count ?? 0) > 0) {
            return Response.json(
              { ok: false, error: `Já existem ${count} projeto(s) no banco. Rode TRUNCATE nas tabelas (SQL Editor) antes de semear de novo.` },
              { status: 409 },
            );
          }

          for (const c of comunidades) {
            const { error } = await supabaseAdmin.from('comunidades').insert({
              code: c.code, nome: c.nome, responsavel_tecnico: c.responsavelTecnico || null,
              segmento_social: c.segmentoSocial || null, eixo_principal: c.eixoPrincipal || null,
              classificacao: c.classificacao || null, localizacao: c.localizacao || null,
              municipio: c.municipio || null, uf: c.uf || null, financiador: c.financiador || null,
              objetivo: c.objetivo || null, valor_total: c.valorTotal, forma_repasse: c.formaRepasse || null,
              status_repasse: c.statusRepasse || null, data_repasse: c.dataRepasse || null,
              inicio_previsto: c.inicioPrevisto || null, final_previsto: c.finalPrevisto || null,
              status: c.status, categorias_tematicas: c.categoriasTematicas || null,
              compradores: c.compradores || null, garantia_venda: c.garantiaVenda || null,
              destinacao: c.destinacao || null, ativacoes: c.ativacoes || null,
              oportunidades: c.oportunidades || null, total_beneficiados_diretos: c.totalBeneficiadosDiretos,
              total_beneficiados_indiretos: c.totalBeneficiadosIndiretos,
              mulheres_beneficiadas: c.mulheresBeneficiadas ?? null, receita_faixa: c.receitaFaixa || null,
              observacoes: c.observacoes || null, plano_trabalho_arquivo: c.planoTrabalhoArquivo || null,
              detalhamento: c.detalhamento || null, justificativa: c.justificativa || null,
              produto_texto: c.produtoTexto || null, infraestrutura: c.infraestrutura || null,
              certificacao: c.certificacao || null, territorio: c.territorio || null,
            });
            if (error) throw error;
            summary.comunidades += 1;
          }

          for (const p of inovaProjetos) {
            const plano = p.plano ?? {};
            const budgetApproved = BUDGET_FIX[p.org ?? ''] ?? p.budgetApproved;
            const { data: projetoRow, error: projetoError } = await supabaseAdmin
              .from('projetos')
              .insert({
                nome: p.name, org: p.org ?? null, segmento: p.segmento ?? null, code: p.code,
                coordenador: p.coordinator, financiador: p.financier, objetivo: p.objective,
                data_inicio: p.startDate, data_fim: p.endDate, status: p.status, progresso: p.progress,
                orcamento_aprovado: budgetApproved, orcamento_executado: p.budgetExecuted,
                nivel_risco: p.riskLevel, drive_link: p.driveLink ?? null, budget_link: p.budgetLink ?? null,
                termo_fomento_link: p.termoFomentoLink ?? null,
                problematica: plano.problematica ?? null, justificativa: plano.justificativa ?? null,
                localizacao_abrangencia: plano.localizacaoAbrangencia ?? null, diversidade: plano.diversidade ?? null,
                saberes_locais: plano.saberesLocais ?? null, experiencia_previa: plano.experienciaPrevia ?? null,
                capacidade_tecnica: plano.capacidadeTecnica ?? null, estrategia: plano.estrategia ?? null,
                cronograma_fisico: plano.cronogramaFisico ?? null, detalhamento_recursos: plano.detalhamentoRecursos ?? null,
                contrapartida: plano.contrapartida ?? null, justificativa_contrapartida: plano.justificativaContrapartida ?? null,
                resultados_impactos: plano.resultadosImpactos ?? null, publico_alvo: plano.publicoAlvo ?? null,
                beneficiados_diretos: plano.beneficiadosDiretos ?? null, beneficiados_indiretos: plano.beneficiadosIndiretos ?? null,
                forma_acompanhamento: plano.formaAcompanhamento ?? null, potencial_replicabilidade: plano.potencialReplicabilidade ?? null,
                potencial_ampliacao: plano.potencialAmpliacao ?? null, pilares: plano.pilares ?? null,
                metas_texto: plano.metasTexto ?? null, detalhamento_plano: plano.detalhamentoPlano ?? null,
                compradores: plano.compradores ?? null, garantia_venda: plano.garantiaVenda ?? null,
                destinacao: plano.destinacao ?? null, ativacoes: plano.ativacoes ?? null,
                oportunidades: plano.oportunidades ?? null, receita_faixa: plano.receitaFaixa ?? null,
                valor_repasse: plano.valorRepasse ?? null, forma_repasse: plano.formaRepasse ?? null,
                status_repasse: plano.statusRepasse ?? null, data_repasse: plano.dataRepasse ?? null,
                observacoes: plano.observacoes ?? null, plano_arquivo: plano.planoArquivo ?? null,
              })
              .select('id')
              .single();
            if (projetoError) throw projetoError;
            const projetoId = projetoRow.id as number;
            summary.projetos += 1;

            if (p.team?.length) {
              const { error } = await supabaseAdmin
                .from('projeto_equipe')
                .insert(p.team.map(nome => ({ projeto_id: projetoId, nome })));
              if (error) throw error;
            }

            const goals = metasProjetos[p.id] ?? [];
            const goalIdMap: Record<number, string> = {};
            for (const g of goals) {
              const { data: metaRow, error: metaError } = await supabaseAdmin
                .from('metas')
                .insert({ projeto_id: projetoId, nome: g.name })
                .select('id')
                .single();
              if (metaError) throw metaError;
              goalIdMap[g.id] = metaRow.id as string;
              summary.metas += 1;

              for (const d of g.deliverables) {
                const { data: entregaRow, error: entregaError } = await supabaseAdmin
                  .from('entregas')
                  .insert({ meta_id: metaRow.id, nome: d.name, resultado_esperado: d.expectedResult })
                  .select('id')
                  .single();
                if (entregaError) throw entregaError;
                summary.entregas += 1;

                if (d.activities.length) {
                  const { error: atividadeError } = await supabaseAdmin.from('atividades').insert(
                    d.activities.map(a => ({
                      entrega_id: entregaRow.id, nome: a.name, responsavel: a.responsible || null,
                      data_planejada: a.plannedDate || null, data_inicio: a.startDate, data_conclusao: a.conclusionDate,
                      progresso: a.progress, status: a.status, observacoes: a.observations || null,
                    })),
                  );
                  if (atividadeError) throw atividadeError;
                  summary.atividades += d.activities.length;
                }
              }
            }

            // p.risks (inovaProjetos) é sempre [] no seed atual — os riscos reais vêm de riscosProjetos.
            const risks = riscosProjetos[p.id] ?? [];
            if (risks.length) {
              const { error: riscoError } = await supabaseAdmin.from('plano_riscos').insert(
                risks.map(r => ({
                  projeto_id: projetoId,
                  meta_id: r.goalId != null ? goalIdMap[r.goalId] ?? null : null,
                  etapa_nome_legado: r.stage ?? null, especificacao_legado: r.spec ?? null,
                  descricao: r.description, categoria: r.category || null,
                  probabilidade: r.probability, impacto: r.impact,
                  estrategia_mitigacao: r.responseStrategy || null, responsavel: r.responsible || null,
                  status: r.status,
                })),
              );
              if (riscoError) throw riscoError;
              summary.riscos += risks.length;
            }
          }

          return Response.json({ ok: true, summary });
        } catch (error) {
          console.error('[api/admin/seed] falha na migração:', error);
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : String(error), summary },
            { status: 500 },
          );
        }
      },
    },
  },
});
