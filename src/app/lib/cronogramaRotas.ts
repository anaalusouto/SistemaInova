export interface AbaRotas { nome: string; oculta: boolean; linhas: string[][] }
export interface DadosRotas { schema: 1; arquivo: string; origemUrl?: string; abas: AbaRotas[] }
export interface LinhaRotas { aba: string; linha: number; valores: string[] }
export interface TabelaRotas { aba: string; cabecalhos: string[]; linhas: LinhaRotas[] }
export interface VisitaRota extends LinhaRotas {
  rota: string; organizacao: string; municipio: string; uf: string; status: string;
  inicio: string | null; fim: string | null; inicioVisita: string | null; fimVisita: string | null;
}
export interface DiaRota extends LinhaRotas {
  rota: string; data: string | null; equipeSemas: string; equipe: string;
  instituicao: string; atividade: string; origem: string; modal: string; pernoite: string;
}
export const chaveRotas = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
export const numeroRota = (v: string) => chaveRotas(v).match(/rota\s*(\d+)/)?.[1] ?? null;
export function dataDaPlanilha(v: string): string | null {
  const texto = v.trim();
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = m ? `${m[3]}-${m[2]}-${m[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : '';
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === iso ? iso : null;
}
export function tabelaDaAba(aba: AbaRotas, indice = 1): TabelaRotas {
  return { aba: aba.nome, cabecalhos: aba.linhas[indice] ?? [],
    linhas: aba.linhas.slice(indice + 1).flatMap((valores, i) => valores.some(v => v.trim()) ? [{ aba: aba.nome, linha: indice + i + 1, valores }] : []) };
}
export function coluna(tabela: Pick<TabelaRotas, 'cabecalhos'>, ...nomes: string[]): number {
  return tabela.cabecalhos.findIndex(c => nomes.some(n => chaveRotas(c) === chaveRotas(n)));
}
export function lerCampo(t: TabelaRotas, l: LinhaRotas, ...nomes: string[]): string {
  return l.valores[coluna(t, ...nomes)] ?? '';
}
export function analisarRotas(dados: DadosRotas) {
  const instituicoes = dados.abas.find(a => chaveRotas(a.nome) === 'instituicoes');
  const cronograma = dados.abas.find(a => chaveRotas(a.nome) === 'cronograma');
  if (!instituicoes || !cronograma) throw new Error('A planilha precisa das abas Instituições e Cronograma.');
  const t = tabelaDaAba(instituicoes), c = tabelaDaAba(cronograma);
  for (const [tabela, campos] of [[t, ['Rota', 'Organização / Comunidade', 'Data inicial ROTA', 'Data Final ROTA']], [c, ['Data', 'Rota', 'Equipe SEMAS', 'Equipe', 'Atividade']]] as const) {
    for (const campo of campos) if (coluna(tabela, campo) < 0) throw new Error(`Coluna “${campo}” não encontrada na aba ${tabela.aba}. Confira o cabeçalho na linha 2.`);
  }
  const avisos: string[] = [];
  const visitas: VisitaRota[] = t.linhas.filter(l => numeroRota(lerCampo(t, l, 'Rota'))).map(l => {
    const get = (...n: string[]) => lerCampo(t, l, ...n);
    const inicio = dataDaPlanilha(get('Data inicial ROTA')), fim = dataDaPlanilha(get('Data Final ROTA'));
    if (!inicio || !fim || inicio > fim) avisos.push(`${t.aba}, linha ${l.linha + 1}: confira o período da rota.`);
    return { ...l, rota: get('Rota'), organizacao: get('Organização / Comunidade'), municipio: get('Município / Localidade'), uf: get('Estado'), status: get('Status'),
      inicio, fim, inicioVisita: dataDaPlanilha(get('Data inicial VISITA')), fimVisita: dataDaPlanilha(get('Data Final VISITA')) };
  });
  const dias: DiaRota[] = c.linhas.filter(l => numeroRota(lerCampo(c, l, 'Rota'))).map(l => {
    const get = (...n: string[]) => lerCampo(c, l, ...n);
    const data = dataDaPlanilha(get('Data'));
    if (!data) avisos.push(`${c.aba}, linha ${l.linha + 1}: data não reconhecida.`);
    return { ...l, rota: get('Rota'), data, equipeSemas: get('Equipe SEMAS'), equipe: get('Equipe'), instituicao: get('Instituição'), atividade: get('Atividade'), origem: get('Origem'), modal: get('Modal'), pernoite: get('Pernoite') };
  });
  const numeros = [...new Set([...visitas.map(v => numeroRota(v.rota)!), ...dias.map(d => numeroRota(d.rota)!)])].sort((a, b) => Number(a) - Number(b));
  for (const n of numeros) {
    const vv = visitas.filter(v => numeroRota(v.rota) === n), dd = dias.filter(d => numeroRota(d.rota) === n);
    if (!vv.length || !dd.length) avisos.push(`Rota ${n}: há dados em apenas uma das abas principais.`);
    for (const d of dd) if (d.data && vv.length && !vv.some(v => v.inicio && v.fim && d.data! >= v.inicio && d.data! <= v.fim)) avisos.push(`Rota ${n}: dia ${d.valores[0]} fora do período informado em Instituições.`);
  }
  const errosFonte = dados.abas.reduce((s, a) => s + a.linhas.flat().filter(v => /^#(N\/A|REF!|VALUE!|DIV\/0!|NAME\?|NUM!|ERROR!)/.test(v)).length, 0);
  if (errosFonte) avisos.push(`${errosFonte} célula(s) com erro da planilha preservadas para conferência.`);
  if (!visitas.length || !dias.length) throw new Error('Nenhuma rota com cronograma encontrada nas abas principais.');
  return { visitas, dias, numeros, avisos: [...new Set(avisos)], instituicoes: t, cronograma: c };
}

/** Cada bloco mantém coordenadas da fonte, inclusive tabelas lado a lado. */
export function blocosDaRota(aba: AbaRotas): { titulo: string; tabela: TabelaRotas }[] {
  const blocos: { titulo: string; tabela: TabelaRotas }[] = [];
  const linhas = aba.linhas;
  const trecho = linhas.findIndex(l => chaveRotas(l[0] ?? '') === 'trecho');
  const apoio = linhas.findIndex(l => l.some(v => /^lista de hot/i.test(v)));
  const check = linhas.findIndex(l => ['check', 'checklist:'].includes(chaveRotas(l[0] ?? '')) && l.some(v => /descri|item/i.test(v)));
  const partes = [{ titulo: 'Dados da visita', inicio: 1, fim: trecho < 0 ? linhas.length : trecho - 1 },
    ...(trecho >= 0 ? [{ titulo: 'Roteiro logístico', inicio: trecho, fim: apoio >= 0 ? apoio : check >= 0 ? check : linhas.length }] : []),
    ...(apoio >= 0 ? [{ titulo: 'Hospedagem e alimentação', inicio: apoio, fim: check >= 0 ? check : linhas.length }] : []),
    ...(check >= 0 ? [{ titulo: 'Checklist', inicio: check, fim: linhas.length }] : [])];
  for (const p of partes) {
    const rows = linhas.slice(p.inicio + 1, p.fim).flatMap((valores, i) => valores.some(v => v.trim()) && !/^ROTEIRO LOG/i.test(valores[0] ?? '') ? [{ aba: aba.nome, linha: p.inicio + i + 1, valores }] : []);
    const largura = Math.max(linhas[p.inicio]?.length ?? 0, ...rows.map(l => l.valores.length));
    blocos.push({ titulo: p.titulo, tabela: { aba: aba.nome, cabecalhos: Array.from({ length: largura }, (_, i) => linhas[p.inicio]?.[i] || `Coluna ${i + 1}`), linhas: rows } });
  }
  return blocos;
}

export function validarDadosRotas(raw: unknown): DadosRotas {
  const d = raw as DadosRotas;
  if (!d || d.schema !== 1 || typeof d.arquivo !== 'string' || !d.arquivo.trim() || d.arquivo.length > 250 || !Array.isArray(d.abas) || d.abas.length > 50) throw new Error('Dados do cronograma inválidos.');
  if (JSON.stringify(d).length > 2500000) throw new Error('O cronograma excede o limite de 2,5 MB.');
  const nomes = new Set<string>();
  for (const a of d.abas) {
    if (typeof a.nome !== 'string' || !a.nome.trim() || a.nome.length > 100 || nomes.has(chaveRotas(a.nome)) || typeof a.oculta !== 'boolean' || !Array.isArray(a.linhas) || a.linhas.length > 2000) throw new Error('Abas inválidas ou repetidas.');
    nomes.add(chaveRotas(a.nome));
    for (const row of a.linhas) if (!Array.isArray(row) || row.length > 100 || row.some(v => typeof v !== 'string' || v.length > 20000)) throw new Error('Há células fora dos limites permitidos.');
  }
  analisarRotas(d);
  return d;
}

export function corrigirCelula(dados: DadosRotas, aba: string, linha: number, coluna: number, valor: string): DadosRotas {
  return corrigirLinha(dados, aba, linha, { [coluna]: valor });
}

export function corrigirLinha(dados: DadosRotas, aba: string, linha: number, alteracoes: Record<string, string>): DadosRotas {
  const copia = structuredClone(dados);
  const a = copia.abas.find(a => a.nome === aba);
  if (!a || !Number.isInteger(linha) || linha < 2 || linha >= a.linhas.length || !alteracoes || typeof alteracoes !== 'object' || Array.isArray(alteracoes) || Object.keys(alteracoes).length > 100) throw new Error('Linha inválida.');
  for (const [indice, valor] of Object.entries(alteracoes)) {
  const coluna = Number(indice);
  if (!/^\d+$/.test(indice) || !Number.isInteger(coluna) || coluna < 0 || coluna >= 100 || typeof valor !== 'string' || valor.length > 20000) throw new Error('Célula inválida.');
  while (a.linhas[linha].length <= coluna) a.linhas[linha].push('');
  const header = chaveRotas(a.linhas[1]?.[coluna] ?? '');
  if ((chaveRotas(aba) === 'instituicoes' && header.startsWith('data ') || chaveRotas(aba) === 'cronograma' && header === 'data') && valor.trim() && !dataDaPlanilha(valor)) throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
  a.linhas[linha][coluna] = valor;
  }
  if (chaveRotas(aba) === 'cronograma') {
    const tabela = tabelaDaAba(a), dataColuna = coluna(tabela, 'Data'), semana = coluna(tabela, 'Dia da Semana');
    const data = dataDaPlanilha(a.linhas[linha][dataColuna] ?? '');
    if (String(dataColuna) in alteracoes && semana >= 0 && data) {
      a.linhas[linha][semana] = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${data}T12:00:00Z`));
    }
  }
  if (chaveRotas(aba) === 'instituicoes') {
    const tabela = tabelaDaAba(a), l = { aba, linha, valores: a.linhas[linha] };
    for (const [inicio, fim] of [['Data inicial ROTA', 'Data Final ROTA'], ['Data inicial VISITA', 'Data Final VISITA']]) {
      const i = dataDaPlanilha(lerCampo(tabela, l, inicio)), f = dataDaPlanilha(lerCampo(tabela, l, fim));
      if (i && f && i > f) throw new Error('A data final não pode ser anterior à inicial.');
    }
  }
  return validarDadosRotas(copia);
}
