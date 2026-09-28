/**
 * Organizações (RC-01 a RC-04): tipos e regras que a tela e o servidor
 * compartilham.
 *
 * A Organização é a tabela `comunidades` — a mesma entidade que o Diagnóstico
 * já usa. O nome da tabela ficou por compatibilidade; no código novo e na tela
 * ela se chama Organização.
 */
import { formatDateOnly } from './dateOnly';

export const NAO_INFORMADO = 'Não informado';

export const CATEGORIAS_ORGANIZACAO = ['Agricultura Familiar', 'Quilombola', 'Indígena', 'Tradicional'] as const;
export type CategoriaOrganizacao = (typeof CATEGORIAS_ORGANIZACAO)[number];

export const TIPOS_ORGANIZACAO = ['Associação', 'Cooperativa'] as const;
export type TipoOrganizacao = (typeof TIPOS_ORGANIZACAO)[number];

export const STATUS_ENCAMINHAMENTO = ['A iniciar', 'Em andamento', 'Concluído'] as const;
export type StatusEncaminhamento = (typeof STATUS_ENCAMINHAMENTO)[number];

export const MEIOS_CONTATO = ['Ligação', 'Meet (video chamada)', 'Whatsapp (msg)', 'E-mail', 'Presencial', 'Outro'] as const;

/**
 * A categoria mora em `segmento_social`, gravada como "Comunidade Tradicional"
 * no seed. O RC-01 chama de "Tradicional". Valor fora da lista vira null —
 * mostrar um texto qualquer como se fosse categoria esconderia o dado errado.
 */
export function categoriaDe(segmentoSocial: string | null | undefined): CategoriaOrganizacao | null {
  const v = (segmentoSocial ?? '').trim().toLowerCase();
  if (!v) return null;
  if (v.includes('agricultura')) return 'Agricultura Familiar';
  if (v.includes('quilombola')) return 'Quilombola';
  if (v.includes('indígena') || v.includes('indigena')) return 'Indígena';
  if (v.includes('tradiciona')) return 'Tradicional';
  return null;
}

export function tipoDe(tipo: string | null | undefined): TipoOrganizacao | null {
  return (TIPOS_ORGANIZACAO as readonly string[]).includes(tipo ?? '') ? (tipo as TipoOrganizacao) : null;
}

/** Texto para exibição: vazio vira "Não informado" (RC-02). */
export function ouNaoInformado(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return NAO_INFORMADO;
  const s = String(v).trim();
  return s ? s : NAO_INFORMADO;
}

export interface OrganizacaoResumo {
  id: string;
  codigo: string;
  nome: string;
  categoria: CategoriaOrganizacao | null;
  tipo: TipoOrganizacao | null;
  municipio: string | null;
  uf: string | null;
  /** Encaminhamentos ainda não concluídos. */
  pendentes: number;
}

export interface PessoaReferencia {
  id: string;
  nome: string;
  funcao: string | null;
  contato: string | null;
}

export interface AnexoRegistro {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
  uploadedAt: string;
}

/** Registro de contato (RC-03). */
export interface RegistroContato {
  id: string;
  data: string;               // AAAA-MM-DD
  hora: string | null;        // HH:MM
  participantes: string[];
  /** Null só em registro anterior ao RC-03, que não tinha assunto. */
  assunto: string | null;
  resumo: string;
  meio: string | null;
  /** Projeto de onde o registro veio, quando veio de um. */
  projetoId: number | null;
  anexo: AnexoRegistro | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type OrigemEncaminhamento =
  | { tipo: 'contato'; registroId: string }
  | { tipo: 'texto'; texto: string };

/** Encaminhamento (RC-04). */
export interface Encaminhamento {
  id: string;
  descricao: string;
  responsavel: string | null;
  dataInicio: string | null;  // AAAA-MM-DD
  dataFim: string | null;     // AAAA-MM-DD
  status: StatusEncaminhamento;
  /** Null quando não há origem, ou quando o registro de origem foi excluído. */
  origem: OrigemEncaminhamento | null;
  criadoPor: string | null;
  atualizadoPor: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProjetoDaOrganizacao {
  id: number;
  codigo: string;
  nome: string;
}

export interface OrganizacaoFicha extends OrganizacaoResumo {
  eixo: string | null;
  localizacao: string | null;
  territorio: string | null;
  status: string | null;
  responsavelTecnico: string | null;
  pessoas: PessoaReferencia[];
  projetos: ProjetoDaOrganizacao[];
  /** Mais recente primeiro. */
  registros: RegistroContato[];
  encaminhamentos: Encaminhamento[];
  /** Null enquanto ninguém escreveu nada. */
  nota: NotaOrganizacao | null;
}

/**
 * Bloco de notas compartilhado da organização. `versao` é a que a pessoa
 * abriu: salvar exige a mesma versão, para que duas pessoas editando ao mesmo
 * tempo não apaguem uma o texto da outra sem perceber.
 */
export interface NotaOrganizacao {
  conteudo: string;
  versao: number;
  atualizadoPor: string | null;
  atualizadoEm: string;
}

export const LIMITE_NOTA = 20000;

/**
 * Rótulo de um registro de contato quando ele aparece como origem.
 *
 * Calculado na hora a partir do registro atual, nunca gravado: é o que faz o
 * vínculo sobreviver a uma correção de data ou assunto (RC-04).
 */
export function rotuloRegistro(r: Pick<RegistroContato, 'data' | 'assunto'>): string {
  return `${formatDateOnly(r.data)} · ${r.assunto?.trim() || 'sem assunto'}`;
}

/** Ordena registros do mais recente para o mais antigo. */
export function ordenarRegistros(registros: RegistroContato[]): RegistroContato[] {
  return [...registros].sort((a, b) => {
    const ka = `${a.data}${a.hora ?? ''}${a.criadoEm}`;
    const kb = `${b.data}${b.hora ?? ''}${b.criadoEm}`;
    return kb.localeCompare(ka);
  });
}

/**
 * Pendentes antes dos concluídos; entre eles, o prazo mais próximo primeiro,
 * e sem prazo por último — é a ordem em que alguém vai querer agir.
 */
export function ordenarEncaminhamentos(lista: Encaminhamento[]): Encaminhamento[] {
  return [...lista].sort((a, b) => {
    const ca = a.status === 'Concluído' ? 1 : 0;
    const cb = b.status === 'Concluído' ? 1 : 0;
    if (ca !== cb) return ca - cb;
    const fa = a.dataFim ?? '9999-12-31';
    const fb = b.dataFim ?? '9999-12-31';
    if (fa !== fb) return fa.localeCompare(fb);
    return a.criadoEm.localeCompare(b.criadoEm);
  });
}

// ---------------------------------------------------------------------------
// Validação — usada no formulário para resposta imediata e repetida no
// servidor, que é onde a regra vale.
// ---------------------------------------------------------------------------

export interface RegistroContatoInput {
  organizacaoId: string;
  data: string;
  hora: string;
  participantes: string[];
  assunto: string;
  resumo: string;
  meio: string;
}

export function validarRegistro(d: RegistroContatoInput): string[] {
  const erros: string[] = [];
  if (!d.data) erros.push('Informe a data.');
  if (!d.participantes.some(p => p.trim())) erros.push('Informe ao menos um participante.');
  if (!d.assunto.trim()) erros.push('Informe o assunto.');
  if (!d.resumo.trim()) erros.push('Informe o resumo do que foi tratado.');
  if (d.hora && !/^\d{2}:\d{2}$/.test(d.hora)) erros.push('A hora deve estar no formato HH:MM.');
  return erros;
}

export interface EncaminhamentoInput {
  organizacaoId: string;
  descricao: string;
  responsavel: string;
  dataInicio: string | null;
  dataFim: string | null;
  status: StatusEncaminhamento;
  origem: OrigemEncaminhamento | null;
}

export function validarEncaminhamento(d: EncaminhamentoInput): string[] {
  const erros: string[] = [];
  if (!d.descricao.trim()) erros.push('Informe a descrição.');
  if (!(STATUS_ENCAMINHAMENTO as readonly string[]).includes(d.status)) erros.push('Status inválido.');
  if (d.dataInicio && d.dataFim && d.dataFim < d.dataInicio) {
    erros.push('A data final não pode ser anterior à data inicial.');
  }
  if (d.origem?.tipo === 'texto' && !d.origem.texto.trim()) {
    erros.push('Descreva a origem ou escolha "Sem origem".');
  }
  return erros;
}

/** Junta a lista de erros numa frase só, para o toast. */
export function juntarErros(erros: string[]): string {
  return erros.join(' ');
}
