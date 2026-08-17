import { createFileRoute } from '@tanstack/react-router';
import { query } from '@/server/db';
export const Route = createFileRoute('/api/health/db')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await query('SELECT now() AS now');
          return Response.json({ ok: true, serverTime: rows[0]?.now ?? null });
        } catch (error) {
          console.error('[api/health/db] falha ao consultar o Postgres:', error);
          return Response.json(
            { ok: false, error: error instanceof Error ? error.message : 'erro desconhecido' },
            { status: 500 },
          );
        }
      },
    },
  },
});
