import { FUNCOES_MATRIZ } from './catalog/matrizPrototipo';
import { AVALIACAO_MATRIZ_CADERNO, IDENTIFICACAO_CADERNO, QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO, EVIDENCIAS_CADERNO, PORTFOLIO_CESTA, PERFIL_CESTA, AVALIACOES_OPERACAO, IMPLANTACAO_CADERNO, type ItemCaderno } from './catalog/cadernoCria';
import { valoresVazios, type RegistroCaderno } from './cadernoCria';
import type { MatrizResposta, Produto, CategoriaProduto } from '../diagnosticos.server';
import type { DocumentoIntercambio, RegistroIntercambio, ValorIntercambio } from './intercambioMarkdown';

const registro = (chave:string,titulo:string,valor:unknown):RegistroIntercambio => {
  const original=JSON.parse(JSON.stringify(valor)) as ValorIntercambio;
  return {chave,titulo,original,resposta:JSON.parse(JSON.stringify(original)) as ValorIntercambio};
};
export function montarMapeamentoIntercambio(d: { organizacaoId:string; diagnosticoId:string; matriz:MatrizResposta[]; caderno:RegistroCaderno[]; produtos:Produto[]; categorias:CategoriaProduto[] }): DocumentoIntercambio {
  const resposta=(item:ItemCaderno,contexto='')=>{
    const r=d.caderno.find(x=>x.codigo===item.codigo&&x.contexto===contexto);
    return registro(`caderno:${item.codigo}:${contexto}`,`${item.codigo} · ${item.texto}${item.opcoes?.length ? ` · Opções: ${item.opcoes.map(o=>`${o.valor}: ${o.descricao}`).join('; ')}` : ''}`,r?.resposta??valoresVazios());
  };
  const matriz:RegistroIntercambio[]=FUNCOES_MATRIZ.flatMap(f=>{
    const r=d.matriz.find(x=>x.funcaoId===f.id);
    const valores={atuacao:r?.atuacao[0]??null,experiencia:r?.experiencia??null,criticidade:r?.criticidade??null,interesse:r?.interesse??null,observacoes:r?.observacoes??null,externo:r?.externo??null};
    const avaliacao=AVALIACAO_MATRIZ_CADERNO.find(x=>x.codigo===f.id)!;
    return [registro(`matriz:${f.id}`,`${f.id} · ${f.nome}`,valores),resposta(avaliacao)];
  });
  const ieo=[...IDENTIFICACAO_CADERNO,...QUESTIONARIO_CADERNO,...COMPLEMENTARES_CADERNO,...EVIDENCIAS_CADERNO].map(x=>resposta(x));
  const cesta:RegistroIntercambio[]=[];
  for(const c of d.categorias) cesta.push(registro(`categoria:${c.id}`,`Categoria · ${c.nome}`,{nome:c.nome}));
  const operacoes=new Set<string>();
  for(const p of d.produtos){
    cesta.push(registro(`produto:${p.id}`,`Produto ou serviço · ${p.nome}`,{nome:p.nome,cadeia:p.cadeia,categoriaId:p.categoriaId,unidadeMedida:p.unidadeMedida,safra:p.safra,canaisComerciais:p.canaisComerciais,etapasEconomicas:p.etapasEconomicas}));
    cesta.push(...[...PORTFOLIO_CESTA,...PERFIL_CESTA,...AVALIACOES_OPERACAO].map(x=>resposta(x,p.id)));
    const situacao=d.caderno.find(x=>x.codigo==='PR_SITUACAO'&&x.contexto===p.id)?.resposta.valor;
    const operacao=d.caderno.find(x=>x.codigo==='PR_OPERACAO'&&x.contexto===p.id)?.resposta.valor;
    if(situacao==='Implantação'&&operacao&&/^OP\d{2,4}$/.test(operacao))operacoes.add(operacao);
  }
  for(const operacao of operacoes)cesta.push(...IMPLANTACAO_CADERNO.map(x=>resposta(x,operacao)));
  const perguntasNovo=[...PORTFOLIO_CESTA,...PERFIL_CESTA,...AVALIACOES_OPERACAO,...IMPLANTACAO_CADERNO].map(item=>({codigo:item.codigo,titulo:`${item.codigo} · ${item.texto}${item.opcoes?.length?` · Opções: ${item.opcoes.map(o=>`${o.valor}: ${o.descricao}`).join('; ')}`:''}`,resposta:{...valoresVazios()}}));
  return {formato:'sistemainova-mapeamento',versao:1,organizacaoId:d.organizacaoId,diagnosticoId:d.diagnosticoId,secoes:{matriz,ieo,cesta},novosProdutos:[{chave:'novo-1',dados:{nome:'',cadeia:null,categoriaId:null,unidadeMedida:null,safra:{estado:'nao_informada',intervalos:[]},canaisComerciais:[],etapasEconomicas:[]},perguntas:perguntasNovo}]};
}
