import { calcularIeoCaderno } from './ieoCaderno';

/** Validade reportada para a aplicação histórica da AGROMEL, isolada por ID. */
export const AGROMEL_ID_REAVALIACAO_IEO = 'c82c2ac0-56cd-4a88-9d67-f7d2ddb8e061';

export function ieoAguardandoReavaliacao(
  organizacaoId: string,
  registros: Parameters<typeof calcularIeoCaderno>[0],
) {
  if (organizacaoId !== AGROMEL_ID_REAVALIACAO_IEO) return false;
  const resultado = calcularIeoCaderno(registros);
  return resultado.total === 25 && resultado.respondidas === 25;
}
