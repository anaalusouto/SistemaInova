import { Pool } from 'pg';

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não está definida. Configure essa variável no serviço do site.',
      );
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result.rows;
}
