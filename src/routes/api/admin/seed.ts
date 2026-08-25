import { createFileRoute } from '@tanstack/react-router';
import { query } from '@/server/db';
import { comunidades } from '@/app/data/comunidades';
import { inovaProjetos } from '@/app/data/inovaProjetos';
import { rotas, calendarSeed } from '@/app/data/rotas';
import { cronogramaExecutivoSeed } from '@/app/data/cronogramaExecutivo';
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
        const summary: Record<string, number> = {};
        try {
          for (const c of comunidades) {
            await query(
              `INSERT INTO communities (id, code, nome, status, eixo_principal, municipio, uf, data, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
               ON CONFLICT (id) DO UPDATE SET
                 code = EXCLUDED.code, nome = EXCLUDED.nome, status = EXCLUDED.status,
                 eixo_principal = EXCLUDED.eixo_principal, municipio = EXCLUDED.municipio,
                 uf = EXCLUDED.uf, data = EXCLUDED.data, updated_at = now()`,
              [c.id, c.code, c.nome, c.status, c.eixoPrincipal, c.municipio ?? null, c.uf ?? null, JSON.stringify(c)],
            );
          }
          summary.communities = comunidades.length;
          for (const p of inovaProjetos) {
            await query(
              `INSERT INTO projects (id, code, name, status, community_id, coordinator, financier, start_date, end_date, budget_approved, budget_executed, progress, data, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
               ON CONFLICT (id) DO UPDATE SET
                 code = EXCLUDED.code, name = EXCLUDED.name, status = EXCLUDED.status,
                 community_id = EXCLUDED.community_id, coordinator = EXCLUDED.coordinator,
                 financier = EXCLUDED.financier, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date,
                 budget_approved = EXCLUDED.budget_approved, budget_executed = EXCLUDED.budget_executed,
                 progress = EXCLUDED.progress, data = EXCLUDED.data, updated_at = now()`,
              [
                p.id, p.code, p.name, p.status, p.communityId ?? null,
                p.coordinator, p.financier, p.startDate, p.endDate,
                p.budgetApproved, p.budgetExecuted, p.progress, JSON.stringify(p),
              ],
            );
          }
          summary.projects = inovaProjetos.length;
          for (const r of rotas) {
            await query(
              `INSERT INTO routes (id, rota, organizacao, municipio, uf, status, data)
               VALUES ($1,$2,$3,$4,$5,$6,$7)
               ON CONFLICT (id) DO UPDATE SET
                 rota = EXCLUDED.rota, organizacao = EXCLUDED.organizacao, municipio = EXCLUDED.municipio,
                 uf = EXCLUDED.uf, status = EXCLUDED.status, data = EXCLUDED.data`,
              [r.id, r.rota, r.organizacao, r.municipio, r.uf, r.status ?? null, JSON.stringify(r)],
            );
          }
          summary.routes = rotas.length;
          for (const e of calendarSeed) {
            await query(
              `INSERT INTO calendar_events (id, title, event_date, route_id, community_id, data)
               VALUES ($1,$2,$3,$4,$5,$6)
               ON CONFLICT (id) DO UPDATE SET
                 title = EXCLUDED.title, event_date = EXCLUDED.event_date,
                 route_id = EXCLUDED.route_id, community_id = EXCLUDED.community_id, data = EXCLUDED.data`,
              [e.id, e.title, e.date, e.rotaId ?? null, e.comunidadeId ?? null, JSON.stringify(e)],
            );
          }
          summary.calendar_events = calendarSeed.length;
          let entregasCount = 0;
          let atividadesCount = 0;
          for (const bloco of cronogramaExecutivoSeed) {
            await query(
              `INSERT INTO gantt_blocks (id, titulo) VALUES ($1,$2)
               ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo`,
              [bloco.id, bloco.bloco],
            );
            for (const entrega of bloco.entregas) {
              await query(
                `INSERT INTO gantt_entregas (id, block_id, entrega, inicio, fim, responsavel, status, progress, comentario)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                 ON CONFLICT (id) DO UPDATE SET
                   block_id = EXCLUDED.block_id, entrega = EXCLUDED.entrega, inicio = EXCLUDED.inicio,
                   fim = EXCLUDED.fim, responsavel = EXCLUDED.responsavel, status = EXCLUDED.status,
                   progress = EXCLUDED.progress, comentario = EXCLUDED.comentario`,
                [entrega.id, bloco.id, entrega.entrega, entrega.inicio, entrega.fim, entrega.responsavel, entrega.status, entrega.progress, entrega.comentario ?? null],
              );
              entregasCount += 1;
              for (const atividade of entrega.atividades) {
                await query(
                  `INSERT INTO gantt_atividades (id, entrega_id, atividade, inicio, fim, responsavel, status, progress, comentario)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                   ON CONFLICT (id) DO UPDATE SET
                     entrega_id = EXCLUDED.entrega_id, atividade = EXCLUDED.atividade, inicio = EXCLUDED.inicio,
                     fim = EXCLUDED.fim, responsavel = EXCLUDED.responsavel, status = EXCLUDED.status,
                     progress = EXCLUDED.progress, comentario = EXCLUDED.comentario`,
                  [atividade.id, entrega.id, atividade.atividade, atividade.inicio, atividade.fim, atividade.responsavel, atividade.status, atividade.progress, atividade.comentario ?? null],
                );
                atividadesCount += 1;
              }
            }
          }
          summary.gantt_blocks = cronogramaExecutivoSeed.length;
          summary.gantt_entregas = entregasCount;
          summary.gantt_atividades = atividadesCount;
          return Response.json({ ok: true, summary });
        } catch (error) {
          console.error('[api/admin/seed] falha na migração:', error);
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : 'erro desconhecido', summary },
            { status: 500 },
          );
        }
      },
    },
  },
});
