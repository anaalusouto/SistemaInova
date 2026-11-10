import { calcularIeoCaderno } from '../diagnostic/ieoCaderno';
import { FUNCOES_MATRIZ, leituraMatriz } from '../diagnostic/catalog/matrizPrototipo';
import { ieoAguardandoReavaliacao } from '../diagnostic/validadeIeoCaderno';
import type { RegistroCaderno } from '../diagnostic/cadernoCria';
import type { MatrizResposta } from '../diagnosticos.server';

/** Sinais paralelos da mesma aplicação. Não relaciona funções a dimensões sem validação. */
export function sinaisPrioridade(organizacaoId: string, caderno: RegistroCaderno[], matriz: MatrizResposta[]) {
  const ieo = calcularIeoCaderno(caderno);
  const aguardando = ieoAguardandoReavaliacao(organizacaoId, caderno);
  const dimensoes = aguardando ? [] : ieo.porDimensao.filter(d => d.media !== null)
    .sort((a, b) => a.media! - b.media!);
  const funcoes = matriz.flatMap(r => {
    const leitura = leituraMatriz(r.criticidade ?? null, r.experiencia ?? null);
    if (leitura !== 'Lacuna crítica' && leitura !== 'Lacuna relevante') return [];
    const funcao = FUNCOES_MATRIZ.find(f => f.id === r.funcaoId);
    return [{ id: r.funcaoId, nome: funcao?.nome ?? r.nomeFuncao ?? r.funcaoId, leitura }];
  }).sort((a, b) => Number(b.leitura === 'Lacuna crítica') - Number(a.leitura === 'Lacuna crítica') || a.nome.localeCompare(b.nome, 'pt-BR'));
  return { ieo, aguardando, dimensoes, funcoes, criticas: funcoes.filter(f => f.leitura === 'Lacuna crítica').length,
    matrizAvaliadas: matriz.filter(r => leituraMatriz(r.criticidade ?? null, r.experiencia ?? null) !== 'Completar avaliação').length };
}
