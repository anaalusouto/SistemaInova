import { calcularIeoCaderno } from './ieoCaderno';
import { FUNCOES_MATRIZ } from './catalog/matrizPrototipo';
import type { RegistroCaderno } from './cadernoCria';

type Registro = Pick<RegistroCaderno, 'codigo' | 'contexto' | 'resposta'>;
const nota = (valor: string | null) => valor !== null && /^[1-4]$/.test(valor) ? Number(valor) : null;
const media = (notas: number[]) => notas.length ? notas.reduce((s, n) => s + n, 0) / notas.length : null;

/** Só usa notas registradas na mesma aplicação; ausência não é zero. */
export function calcularNotaConsolidada(registros: Registro[], produtos: { id: string }[]) {
  const ieo = calcularIeoCaderno(registros);
  const funcoes = new Set(FUNCOES_MATRIZ.map(f => f.id));
  const produtosValidos = new Set(produtos.map(p => p.id));
  const funcionamento = new Set(registros.filter(r => produtosValidos.has(r.contexto) && r.codigo === 'PR_SITUACAO' && r.resposta.valor === 'Funcionamento').map(r => r.contexto));
  const notasMatriz = registros.filter(r => r.contexto === '' && funcoes.has(r.codigo)).map(r => nota(r.resposta.valor)).filter((n): n is number => n !== null);
  const notasCesta = registros.filter(r => funcionamento.has(r.contexto) && /^C(0[1-9]|1[0-2])$/.test(r.codigo)).map(r => nota(r.resposta.valor)).filter((n): n is number => n !== null);
  const componentes = [
    { id: 'ieo', nome: 'IEO', nota: ieo.geral, peso: .5, pontuadas: ieo.pontuadas },
    { id: 'matriz', nome: 'Matriz', nota: media(notasMatriz), peso: .25, pontuadas: notasMatriz.length },
    { id: 'cesta', nome: 'Cesta', nota: media(notasCesta), peso: .25, pontuadas: notasCesta.length },
  ];
  const pesoDisponivel = componentes.reduce((s, c) => s + (c.nota === null ? 0 : c.peso), 0);
  return {
    nota: pesoDisponivel ? componentes.reduce((s, c) => s + (c.nota ?? 0) * c.peso, 0) / pesoDisponivel : null,
    parcial: pesoDisponivel < 1 || ieo.pontuadas < ieo.total || notasMatriz.length < funcoes.size || notasCesta.length < funcionamento.size * 12,
    pesoDisponivel,
    componentes,
  };
}
