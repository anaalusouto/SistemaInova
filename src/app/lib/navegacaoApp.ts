import type { RotaOrg, SecaoOrg } from './navegacaoOrg';

export type AreaApp = 'overview' | 'organizations' | 'schedule' | 'diagnostics' | 'reports' | 'settings';
export type AbaProjeto = 'descricao' | 'plano' | 'orcamento';
export type AbaGestao = 'plano' | 'rotas' | 'calendario' | 'executivo' | 'kanban' | 'mensagens';
export type InstrumentoDiagnostico = 'resumo' | 'matriz' | 'ieo' | 'cesta' | 'parecer';

export interface BuscaApp {
  area?: AreaApp;
  org?: string;
  secao?: SecaoOrg;
  projeto?: number;
  aba?: AbaProjeto;
  foco?: string;
  gestao?: AbaGestao;
  popup?: string;
  visaoDiagnostico?: 'versoes' | 'editor' | 'atual';
  diagnostico?: string;
  instrumento?: InstrumentoDiagnostico;
}

const areas: readonly AreaApp[] = ['overview', 'organizations', 'schedule', 'diagnostics', 'reports', 'settings'];
const secoes: readonly SecaoOrg[] = ['dados', 'projetos', 'projeto', 'encaminhamentos', 'registros', 'mapeamento', 'parecer'];
const abas: readonly AbaProjeto[] = ['descricao', 'plano', 'orcamento'];
const texto = (v: unknown) => typeof v === 'string' && v.trim() && v.length <= 160 && !/[\u0000-\u001f]/.test(v) ? v.trim() : undefined;

/** Somente o contexto de navegação entra na URL; formulário e sessão não entram. */
export function validarBuscaApp(raw: Record<string, unknown>): BuscaApp {
  const area = areas.includes(raw.area as AreaApp) ? raw.area as AreaApp : undefined;
  const popup = typeof raw.popup === 'string' && /^[a-zA-Z0-9:_-]{1,220}$/.test(raw.popup) ? { popup: raw.popup } : {};
  const contextoDiagnostico = () => ({
    ...(['versoes', 'editor', 'atual'].includes(raw.visaoDiagnostico as string) ? { visaoDiagnostico: raw.visaoDiagnostico as BuscaApp['visaoDiagnostico'] } : {}),
    ...(texto(raw.diagnostico) ? { diagnostico: texto(raw.diagnostico) } : {}),
    ...(['resumo', 'matriz', 'ieo', 'cesta', 'parecer'].includes(raw.instrumento as string) ? { instrumento: raw.instrumento as InstrumentoDiagnostico } : {}),
  });
  if (area === 'schedule') return { area, gestao: (['plano', 'rotas', 'calendario', 'executivo', 'kanban', 'mensagens'] as unknown[]).includes(raw.gestao) ? raw.gestao as AbaGestao : 'plano', ...popup };
  if (area === 'diagnostics') return { area, ...(texto(raw.org) ? { org: texto(raw.org), ...contextoDiagnostico() } : {}) };
  if (area !== 'organizations') return area ? { area } : {};
  const org = texto(raw.org);
  // Links antigos do projeto abrem a seção exclusiva de encaminhamentos.
  const secao = org && raw.aba === 'encaminhamentos' && (raw.secao === 'projeto' || raw.secao === 'projetos')
    ? 'encaminhamentos'
    : secoes.includes(raw.secao as SecaoOrg) ? raw.secao as SecaoOrg : 'dados';
  const id = typeof raw.projeto === 'number' || typeof raw.projeto === 'string' && /^\d+$/.test(raw.projeto) ? Number(raw.projeto) : NaN;
  const projeto = Number.isSafeInteger(id) && id > 0 ? id : undefined;
  const noProjeto = secao === 'projeto' || secao === 'projetos';
  if (!org && !projeto) return { area };
  return {
    area,
    ...popup,
    ...(org ? { org, secao } : { secao: 'projeto' }),
    ...(noProjeto || !org ? {
      ...(projeto ? { projeto } : {}),
      aba: abas.includes(raw.aba as AbaProjeto) ? raw.aba as AbaProjeto : 'plano',
    } : {}),
    ...(texto(raw.foco) ? { foco: texto(raw.foco) } : {}),
    ...(org && (secao === 'mapeamento' || secao === 'parecer') ? contextoDiagnostico() : {}),
  };
}

export function buscaDaOrganizacao(rota: RotaOrg): BuscaApp {
  return validarBuscaApp({ area: 'organizations', org: rota.orgId, secao: rota.secao,
    projeto: rota.projetoId, aba: rota.abaProjeto, foco: rota.foco });
}

export function rotaDaBusca(busca: BuscaApp): RotaOrg {
  return { orgId: busca.org ?? null, secao: busca.secao ?? 'dados', projetoId: busca.projeto ?? null,
    abaProjeto: busca.aba, foco: busca.foco ?? null };
}
