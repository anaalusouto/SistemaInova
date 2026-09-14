/**
 * Formata uma data pura (coluna DATE do Postgres, "YYYY-MM-DD") como "DD/MM/AAAA"
 * sem passar por `Date`/fuso horário — `new Date("2026-09-15")` é interpretado como
 * meia-noite UTC e, em fusos atrás de UTC, `toLocaleDateString` exibe o dia anterior.
 * Use isto para colunas DATE (ex.: data_aplicacao); timestamps (criado_em,
 * atualizado_em) devem continuar usando `new Date(iso).toLocaleDateString(...)`.
 */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
