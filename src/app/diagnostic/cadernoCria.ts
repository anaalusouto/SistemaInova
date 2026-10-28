import { ITENS_CADERNO } from './catalog/cadernoCria';
export interface ValoresCaderno { valor: string | null; selecoes: string[]; relato: string; fonte: string; respondentes: string }
export interface RegistroCaderno { diagnostico_id: string; codigo: string; contexto: string; resposta: ValoresCaderno; versao: number; atualizado_em: string; atualizado_por: string }
export const valoresVazios = (): ValoresCaderno => ({ valor: null, selecoes: [], relato: '', fonte: '', respondentes: '' });
export function validarRespostaCaderno(codigo: string, contexto: string, r: ValoresCaderno) {
  const item = ITENS_CADERNO.find(i => i.codigo === codigo);
  if (!item || !r || typeof r !== 'object') throw new Error('Item do caderno inválido.');
  const produto = /^(CP|C\d|PR_)/.test(codigo), implantacao = codigo.startsWith('IM');
  if (produto ? !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(contexto) : implantacao ? !/^OP\d{2,4}$/.test(contexto) : contexto !== '') throw new Error('Contexto do instrumento inválido.');
  for (const v of [r.relato, r.fonte, r.respondentes]) if (typeof v !== 'string' || v.length > 20000) throw new Error('Relato, fonte e respondentes devem ter até 20.000 caracteres.');
  if (r.valor !== null && (typeof r.valor !== 'string' || r.valor.length > 20000)) throw new Error('Resposta inválida.');
  if (!Array.isArray(r.selecoes) || r.selecoes.some(v => typeof v !== 'string') || new Set(r.selecoes).size !== r.selecoes.length) throw new Error('Seleções inválidas.');
  if (item.tipo !== 'texto' && r.valor !== null && !item.opcoes?.some(o => o.valor === r.valor)) throw new Error('Escolha uma opção do caderno.');
  if (item.tipo === 'multipla' && (r.valor !== null || r.selecoes.some(v => !item.opcoes?.some(o => o.valor === v)))) throw new Error('Escolha as opções do caderno.');
  if (item.tipo !== 'multipla' && r.selecoes.length) throw new Error('Este item não aceita múltipla seleção.');
  if (['NA', 'N/A', 'D', 'H'].includes(r.valor ?? '') && !r.relato.trim()) throw new Error('Registre a justificativa ou as diferenças no relato antes de salvar.');
  if (codigo === 'PR_CODIGO' && r.valor && !/^PR\d{2,4}$/.test(r.valor)) throw new Error('Use um código como PR01.');
  if (codigo === 'PR_OPERACAO' && r.valor && !/^OP\d{2,4}$/.test(r.valor)) throw new Error('Use um código como OP01.');
}
