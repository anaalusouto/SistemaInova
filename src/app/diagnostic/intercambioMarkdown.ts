/** Formato de intercâmbio. `original` é a referência imutável para detectar conflitos. */
export type SecaoIntercambio = 'matriz' | 'ieo' | 'cesta';
export type ValorIntercambio = null | boolean | number | string | ValorIntercambio[] | { [chave: string]: ValorIntercambio };
export interface RegistroIntercambio {
  chave: string;
  titulo: string;
  original: ValorIntercambio;
  resposta: ValorIntercambio;
}
export interface DocumentoIntercambio {
  formato: 'sistemainova-mapeamento';
  versao: 1;
  organizacaoId: string;
  diagnosticoId: string;
  assinatura?: string;
  secoes: Record<SecaoIntercambio, RegistroIntercambio[]>;
  novosProdutos?: NovoProdutoIntercambio[];
}
export interface NovoProdutoIntercambio { chave:string; dados:ValorIntercambio; perguntas:{codigo:string;titulo:string;resposta:ValorIntercambio}[] }
export interface AlteracaoIntercambio { secao: SecaoIntercambio; chave: string; titulo: string; original: ValorIntercambio; atual: ValorIntercambio; proposto: ValorIntercambio; conflito: boolean }
const secoes: SecaoIntercambio[] = ['matriz', 'ieo', 'cesta'];
const objeto = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const canonico = (v: ValorIntercambio): string => {
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  if (v !== null && typeof v === 'object') return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${canonico(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
};
/** Somente a referência exportada é assinada; respostas e novos produtos podem ser editados. */
export function baseAssinaturaIntercambio(documento:DocumentoIntercambio):string {
  return canonico({formato:documento.formato,versao:documento.versao,organizacaoId:documento.organizacaoId,diagnosticoId:documento.diagnosticoId,secoes:Object.fromEntries(secoes.map(secao=>[secao,documento.secoes[secao].map(r=>({chave:r.chave,original:r.original})).sort((a,b)=>a.chave.localeCompare(b.chave))]))} as ValorIntercambio);
}
export function criarMarkdownMapeamento(documento: DocumentoIntercambio): string {
  validarDocumentoIntercambio(documento);
  return '# Mapeamento SistemaInova\n\nEste arquivo pode ser revisado com apoio de IA e importado novamente na mesma aplicação. Mantenha um único bloco JSON válido. Para registros existentes, altere somente `resposta`; preserve `original`, chaves, títulos e identificadores. Para incluir produtos, preencha o modelo em `novosProdutos`; para mais produtos, duplique o modelo e dê a cada cópia uma `chave` diferente. Deixe o modelo vazio se não houver produto novo.\n\nUse somente informações verificadas; conserve os valores existentes quando a fonte não trouxer atualização. Não troque um valor preenchido por null sem intenção explícita de apagá-lo. Registre contexto e justificativas no relato e identifique a fonte quando conhecida.\n\nNa Matriz, `atuacao` aceita: Não realiza, Executa, Viabiliza, Viabiliza e executa; `experiencia` aceita: Não está acontecendo, Inicial, Recorrente; `criticidade` e `interesse` aceitam as strings 1 a 4. Para perguntas com opções, use exatamente o código indicado no título. `NA`, `N/A`, `D` e `H` exigem justificativa em `relato`. No Caderno, use `selecoes` apenas em perguntas de múltipla escolha. Perfil e avaliação da Cesta só se aplicam a produtos em funcionamento; implantação só se aplica a operações em implantação.\n\n```json\n' + JSON.stringify(documento, null, 2) + '\n```\n';
}
export function lerMarkdownMapeamento(texto: string): DocumentoIntercambio {
  if (texto.length > 10_000_000) throw new Error('O arquivo excede o limite de 10 MB.');
  const blocos = [...texto.matchAll(/^```json\s*\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  if (blocos.length !== 1) throw new Error('O arquivo deve conter exatamente um bloco JSON do mapeamento.');
  let documento: unknown;
  try { documento = JSON.parse(blocos[0][1]); } catch { throw new Error('O bloco de dados não contém JSON válido.'); }
  validarDocumentoIntercambio(documento);
  return documento;
}
export function validarDocumentoIntercambio(documento: unknown): asserts documento is DocumentoIntercambio {
  if (!objeto(documento) || documento.formato !== 'sistemainova-mapeamento' || documento.versao !== 1 || typeof documento.organizacaoId !== 'string' || typeof documento.diagnosticoId !== 'string' || !objeto(documento.secoes)) throw new Error('Arquivo de mapeamento inválido ou incompatível.');
  if(Object.keys(documento).some(k=>!['formato','versao','organizacaoId','diagnosticoId','assinatura','secoes','novosProdutos'].includes(k)))throw new Error('O arquivo contém campos desconhecidos.');
  if (Object.keys(documento.secoes).some(k=>!secoes.includes(k as SecaoIntercambio))) throw new Error('O arquivo contém uma seção desconhecida.');
  for (const secao of secoes) {
    const registros = documento.secoes[secao];
    if (!Array.isArray(registros)) throw new Error(`A seção ${secao} está ausente ou inválida.`);
    const chaves = new Set<string>();
    for (const r of registros) {
      if (!objeto(r) || Object.keys(r).some(k=>!['chave','titulo','original','resposta'].includes(k)) || typeof r.chave !== 'string' || !r.chave.trim() || typeof r.titulo !== 'string' || !Object.hasOwn(r,'original') || !Object.hasOwn(r,'resposta')) throw new Error(`Registro inválido na seção ${secao}.`);
      if (chaves.has(r.chave)) throw new Error(`Registro duplicado na seção ${secao}: ${r.chave}.`);
      chaves.add(r.chave);
    }
  }
  if(documento.novosProdutos!==undefined){
    if(!Array.isArray(documento.novosProdutos)||documento.novosProdutos.length>50)throw new Error('Lista de novos produtos inválida.');
    const chaves=new Set<string>();
    const codigos=['PR_CODIGO','PR_OPERACAO','PR_SITUACAO','PR_PAPEL',...Array.from({length:19},(_,i)=>`CP${String(i+1).padStart(2,'0')}`),...Array.from({length:12},(_,i)=>`C${String(i+1).padStart(2,'0')}`),...Array.from({length:7},(_,i)=>`IM${String(i+1).padStart(2,'0')}`)];
    for(const p of documento.novosProdutos){
      if(!objeto(p)||Object.keys(p).some(k=>!['chave','dados','perguntas'].includes(k))||typeof p.chave!=='string'||!/^novo-[a-zA-Z0-9_-]{1,60}$/.test(p.chave)||chaves.has(p.chave)||!objeto(p.dados)||!Array.isArray(p.perguntas))throw new Error('Novo produto inválido ou com chave repetida.');
      const recebidos=new Set<string>();
      for(const q of p.perguntas){if(!objeto(q)||Object.keys(q).some(k=>!['codigo','titulo','resposta'].includes(k))||typeof q.codigo!=='string'||!codigos.includes(q.codigo)||recebidos.has(q.codigo)||typeof q.titulo!=='string'||!objeto(q.resposta))throw new Error('Perguntas do produto novo inválidas.');recebidos.add(q.codigo);}
      if(recebidos.size!==codigos.length)throw new Error('O produto novo precisa manter todas as perguntas do modelo.');
      chaves.add(p.chave);
    }
  }
}
export function compararIntercambio(proposto: DocumentoIntercambio, atual: DocumentoIntercambio): AlteracaoIntercambio[] {
  validarDocumentoIntercambio(proposto); validarDocumentoIntercambio(atual);
  if (proposto.organizacaoId !== atual.organizacaoId || proposto.diagnosticoId !== atual.diagnosticoId) throw new Error('O arquivo pertence a outro mapeamento ou organização.');
  const alteracoes: AlteracaoIntercambio[] = [];
  for (const secao of secoes) {
    const presentes = new Map(atual.secoes[secao].map(r=>[r.chave,r]));
    const recebidos = new Set(proposto.secoes[secao].map(r=>r.chave));
    if (presentes.size !== recebidos.size || [...presentes.keys()].some(k=>!recebidos.has(k))) throw new Error(`Os registros da seção ${secao} mudaram ou o arquivo foi alterado estruturalmente. Exporte novamente.`);
    for (const r of proposto.secoes[secao]) {
      const salvo = presentes.get(r.chave)!;
      if (canonico(r.resposta) === canonico(r.original)) continue;
      alteracoes.push({ secao, chave:r.chave, titulo:salvo.titulo, original:r.original, atual:salvo.resposta, proposto:r.resposta, conflito:canonico(r.original)!==canonico(salvo.resposta) });
    }
  }
  for(const novo of proposto.novosProdutos??[]){
    const dados=novo.dados;
    const dadosVazios={nome:'',cadeia:null,categoriaId:null,unidadeMedida:null,safra:{estado:'nao_informada',intervalos:[]},canaisComerciais:[],etapasEconomicas:[]} as ValorIntercambio;
    const vazio=canonico(dados)===canonico(dadosVazios)&&novo.perguntas.every(p=>objeto(p.resposta)&&p.resposta.valor===null&&Array.isArray(p.resposta.selecoes)&&p.resposta.selecoes.length===0&&!p.resposta.relato&&!p.resposta.fonte&&!p.resposta.respondentes);
    if(vazio)continue;
    alteracoes.push({secao:'cesta',chave:`novo_produto:${novo.chave}`,titulo:`Novo produto · ${objeto(dados)?String(dados.nome??''):''}`,original:null,atual:null,proposto:novo as unknown as ValorIntercambio,conflito:false});
  }
  return alteracoes;
}
