export interface PessoaQuadro { login: string; name: string }

const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const aliasesAna = new Set(['ana luiza', 'ana souto', 'ana luiza souto']);
const nomeAna = 'Ana Luiza Souto';
const equipe: PessoaQuadro = { login: 'equipe:instituicoes-coordenadores', name: 'Instituições / Coordenadores' };

function institucional(nome: string): boolean {
  return normalizar(nome) === normalizar(equipe.name) || /^(?:instituicao|instituicoes)$/.test(normalizar(nome)) ||
    /^(?:(?:equipe|instituicao|instituicoes)\s+(?:da\s+|do\s+)?)?(?:cesupa|ceswupa|fas|funbio|semas)$/.test(normalizar(nome)) ||
    /^(?:coordenador(?:a|es|as)?|coordenacao)(?:\s|$)/.test(normalizar(nome));
}

/** Combinações geram participações no mesmo registro, nunca cópias da tarefa. */
function separar(valor: string, pessoas: PessoaQuadro[]): string[] {
  const nome = valor.trim();
  if (institucional(nome)) return [nome];
  // Preserva nomes cadastrados que contenham "e" ou pontuação de sobrenome.
  if (pessoas.some(p => normalizar(p.name) === normalizar(nome)) && !/[+/,;&\n\r]/.test(nome)) return [nome];
  return nome.split(/\s*(?:[+/,;&\n\r]|\s+-\s+|\be\b)\s*/i).map(n => n.trim()).filter(Boolean);
}

const partes = (nome: string) => normalizar(nome).split(' ').filter(n => !['de','da','do','dos','das'].includes(n));
function abrevia(nome: string, completo: string): boolean {
  const a = partes(nome); const b = partes(completo);
  if (!a.length || a[0] !== b[0] || a.length > b.length) return false;
  let posicao = 0;
  for (const token of a) {
    const indice = b.indexOf(token, posicao);
    if (indice < 0) return false;
    posicao = indice + 1;
  }
  return true;
}

/** Resolve apelidos explícitos e abreviações inequívocas, sem mesclar contas. */
export function criarResolvedorResponsaveis(pessoas: PessoaQuadro[], nomes: string[] = []) {
  const cache = new Map<string, PessoaQuadro>();
  const candidatos = new Map<string, string>();
  for (const n of [...pessoas.map(p => p.name), ...nomes.flatMap(n => separar(n, pessoas))]) {
    const nome = aliasesAna.has(normalizar(n)) ? nomeAna : n.trim();
    if (nome && !institucional(nome) && !candidatos.has(normalizar(nome))) candidatos.set(normalizar(nome), nome);
  }
  function pessoa(nome: string, login?: string): PessoaQuadro {
    if (institucional(nome)) return equipe;
    const alias = aliasesAna.has(normalizar(nome));
    const contaConhecida = login && pessoas.find(p => p.login === login && abrevia(nome, p.name));
    const base = alias ? nomeAna : contaConhecida ? contaConhecida.name : nome;
    const extensoes = [...candidatos.values()].filter(n => abrevia(base, n));
    const completas = extensoes.filter(n => !extensoes.some(outra => normalizar(n) !== normalizar(outra) && abrevia(n, outra)));
    const canonico = alias ? nomeAna : completas.length === 1 ? completas[0] : base;
    const contas = pessoas.filter(p => normalizar(p.name) === normalizar(canonico)).sort((a,b) => a.login.localeCompare(b.login));
    if (contas.length === 1) return { login: contas[0].login, name: canonico };
    if (contas.length > 1) return { login: `pessoa:${normalizar(canonico)}`, name: canonico };
    // Uma conta com nome abreviado também pode representar a identidade completa.
    const abreviadas = pessoas.filter(p => {
      const pAlias = aliasesAna.has(normalizar(p.name));
      if (pAlias && alias) return true;
      const destinos = [...candidatos.values()].filter(n => abrevia(p.name, n));
      const finais = destinos.filter(n => !destinos.some(o => normalizar(n) !== normalizar(o) && abrevia(n,o)));
      return finais.length === 1 && normalizar(finais[0]) === normalizar(canonico);
    });
    if (abreviadas.length === 1) return { login: abreviadas[0].login, name: canonico };
    if (abreviadas.length > 1) return { login: `pessoa:${normalizar(canonico)}`, name: canonico };
    const conhecida = login && pessoas.find(p => p.login === login && normalizar(p.name) === normalizar(base));
    return { login: conhecida ? conhecida.login : `nome:${normalizar(canonico)}`, name: canonico };
  }
  return (valor: string, login?: string): PessoaQuadro[] => {
    const nomes = separar(valor, pessoas);
    if (!nomes.length && login) {
      const conhecida = pessoas.find(p => p.login === login);
      return conhecida ? [pessoa(conhecida.name, login)] : [{ login, name: login }];
    }
    const distintas = new Map<string, PessoaQuadro>();
    for (const nome of nomes) {
      const dicaLogin = nomes.length === 1 ? login : undefined;
      const chave = `${normalizar(nome)}|${dicaLogin ?? ''}`;
      let resolvida = cache.get(chave);
      if (!resolvida) { resolvida = pessoa(nome, dicaLogin); cache.set(chave, resolvida); }
      distintas.set(resolvida.login, resolvida);
    }
    return [...distintas.values()];
  };
}

/** Remove colunas vazias de apelidos, usando as mesmas identidades dos cartões. */
export function pessoasDoQuadro(pessoas: PessoaQuadro[], tarefas: { atribuidoParaLogin: string; atribuidoParaNome: string }[]): PessoaQuadro[] {
  const resolver = criarResolvedorResponsaveis(pessoas, tarefas.map(t => t.atribuidoParaNome));
  const colunas = new Map<string, PessoaQuadro>();
  for (const p of pessoas) for (const canonica of resolver(p.name, p.login)) colunas.set(canonica.login, canonica);
  for (const t of tarefas) colunas.set(t.atribuidoParaLogin, { login: t.atribuidoParaLogin, name: t.atribuidoParaNome });
  return [...colunas.values()];
}

/** Mover uma participação mantém os outros responsáveis da tarefa conjunta. */
export function substituirResponsavelDoQuadro(atuais: PessoaQuadro[], origem: string, destino: PessoaQuadro): PessoaQuadro {
  const pessoas = new Map(atuais.filter(p => p.login !== origem).map(p => [p.login, p]));
  pessoas.set(destino.login, destino);
  const lista = [...pessoas.values()];
  return lista.length === 1 ? lista[0] : { login: `grupo:${lista.map(p => p.login).sort().join('|')}`, name: lista.map(p => p.name).join(' + ') };
}
