export type TipoPlano = 'meta' | 'etapa' | 'atividade';
export const TIPOS_PLANO: TipoPlano[] = ['meta', 'etapa', 'atividade'];
export const ROTULOS_TIPO: Record<TipoPlano, string> = { meta: 'Meta', etapa: 'Etapa', atividade: 'Atividade' };
export interface RegistroReclassificacao {
  tipo: TipoPlano; id: string; nome: string; pai: string | null;
}
export interface DependenciaReclassificacao {
  chave: string; tabela: string; id: string; nome: string; grupo: string;
}
export interface PreviaReclassificacao {
  projeto: number; tipo: TipoPlano; id: string; nome: string; token: string;
  dependencias: DependenciaReclassificacao[]; registros: RegistroReclassificacao[];
}
export interface ReclassificarPlanoInput {
  tipo: TipoPlano; id: string; novoTipo: TipoPlano; paiId: string | null;
  token: string; motivo: string; destinos: { chave: string; destinoId: string }[];
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validarReclassificacao(d: ReclassificarPlanoInput): void {
  if (!d || !TIPOS_PLANO.includes(d.tipo) || !TIPOS_PLANO.includes(d.novoTipo) || d.tipo === d.novoTipo || !uuid.test(d.id)) {
    throw new Error('Escolha o registro e um tipo diferente do atual.');
  }
  if ((d.novoTipo === 'meta' ? d.paiId !== null : !uuid.test(d.paiId ?? '')) ||
      !/^[0-9a-f]{32}$/.test(d.token ?? '') || typeof d.motivo !== 'string' || !d.motivo.trim() || d.motivo.length > 2000) {
    throw new Error('Informe o destino, o motivo e atualize a prévia antes de salvar.');
  }
  if (!Array.isArray(d.destinos) || d.destinos.some(m => !m || typeof m.chave !== 'string' || !uuid.test(m.destinoId)) ||
      new Set(d.destinos.map(m => m.chave)).size !== d.destinos.length) {
    throw new Error('Escolha um único destino para cada vínculo.');
  }
}
