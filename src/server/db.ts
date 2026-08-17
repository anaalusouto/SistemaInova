import { Pool } from 'pg';
let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL não está definida. Configure essa variável no serviço do site, no Railway ' +
          '(Variáveis → Nova variável → DATABASE_URL → ${{Postgres.DATABASE_URL}}).',
      );
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
export async function query(text, params) {
  const result = await getPool().query(text, params);
  return result.rows;
}
