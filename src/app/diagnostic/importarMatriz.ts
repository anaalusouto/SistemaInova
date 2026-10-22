import { ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, FUNCOES_MATRIZ, NIVEIS_MATRIZ, type MatrizPrototipoInput } from './catalog/matrizPrototipo';
export type RascunhoMatriz=Omit<MatrizPrototipoInput,'organizacaoId'|'diagnosticoId'|'funcaoId'|'importacao'>;
export type CampoImportado=Exclude<keyof RascunhoMatriz,'nomeFuncao'>;
export type EstadoImportacao='reconhecido'|'ausente'|'ambiguo';
export interface ConferenciaFuncao {campos:Record<CampoImportado,EstadoImportacao>; valores?:Partial<Record<CampoImportado,string[]>>}
export interface ImportacaoMatriz {respostas:Record<string,RascunhoMatriz>;pendencias:string[];conferencia:Record<string,ConferenciaFuncao>}
export const CAMPOS_IMPORTACAO=['atuacao','experiencia','criticidade','interesse','observacoes','externo'] as const;
const rotulos:Record<CampoImportado,string>={atuacao:'Atuação',experiencia:'Experiência',criticidade:'Criticidade atual',interesse:'Interesse em desenvolvimento',observacoes:'Observação',externo:'Externo'};
export type DecisoesImportacao=Partial<Record<CampoImportado,'corrigido'|'nao_identificado'>>;
export interface OrigemPdf {nomeArquivo:string;sha256:string;tamanho:number}
export interface ImportacaoSalva {id:string;dados:ImportacaoMatriz;origem:OrigemPdf;pendentes:string[];estado:'pendente'|'conferida'|'descartada';criadoEm:string}
export const rascunhoVazio=(nomeFuncao:string):RascunhoMatriz=>({nomeFuncao,atuacao:null,experiencia:null,criticidade:null,interesse:null,observacoes:null,externo:null});
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const definicoes=[['Atuação','atuacao',ATUACAO_MATRIZ],['Experiência','experiencia',EXPERIENCIA_MATRIZ],['Criticidade atual','criticidade',NIVEIS_MATRIZ],['Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ],['Observação','observacoes',null],['Externo','externo',null]] as const;
const vazios=['','nao informado','—','-'];
export function interpretarTextoMatriz(texto:string):ImportacaoMatriz {
  if(typeof texto!=='string'||texto.length>1000000)throw new Error('O texto extraído deve ter até 1 milhão de caracteres.');
  const resultado:ImportacaoMatriz={respostas:{},pendencias:[],conferencia:{}};
  const blocos:{id:string;linhas:string[];conflito:boolean}[]=[];
  for(const linha of texto.replace(/\r/g,'').split('\n')) {
    const semRotulo=linha.replace(/^\s*Fun[çc][ãa]o\s*:?\s*/i,'').trim();
    const cabecalho=/^(F\d{2})\b\s*[-–—.:]?\s*(.*)$/i.exec(semRotulo);
    const id=cabecalho?.[1].toUpperCase();
    const porNome=FUNCOES_MATRIZ.find(f=>normal(f.nome)===normal(cabecalho?cabecalho[2]:semRotulo));
    if(id||porNome) {
      const codigo=id??porNome!.id;
      const conflito=Boolean(id&&cabecalho![2]&&(!porNome||porNome.id!==id));
      const ultimo=blocos.at(-1);
      if(ultimo?.id===codigo&&!ultimo.linhas.some(l=>l.trim())){ultimo.conflito||=conflito;continue;}
      blocos.push({id:codigo,linhas:[],conflito});
    }else if(/^\s*Fun[çc][ãa]o\s*:/i.test(linha)||/^F[\d?�]{1,3}\s/.test(semRotulo)){
      blocos.push({id:'Função não identificada: '+semRotulo.slice(0,100),linhas:[],conflito:true});
    }else blocos.at(-1)?.linhas.push(linha);
  }
  for(const id of [...new Set(blocos.map(b=>b.id))]) {
    const funcao=FUNCOES_MATRIZ.find(f=>f.id===id),partes=blocos.filter(b=>b.id===id);
    if(!funcao){resultado.pendencias.push(id+': função fora do catálogo atual.');continue;}
    const valores=new Map<CampoImportado,string[]>();
    for(const bloco of partes){let ativo:CampoImportado|null=null;
      for(const linha of bloco.linhas){const indice=linha.indexOf(':'),label=normal(indice<0?linha:linha.slice(0,indice));
        const campo=definicoes.find(([nome])=>normal(nome)===label||(nome==='Observação'&&label==='observacoes'));
        if(campo){ativo=campo[1];const lista=valores.get(ativo)??[];lista.push(indice<0?'':linha.slice(indice+1).trim());valores.set(ativo,lista);}
        else if(label==='leitura orientativa'){ativo=null;}
        else if(indice>=0&&/^[\p{L} ]{2,60}$/u.test(linha.slice(0,indice).trim())){ativo=null;resultado.pendencias.push(id+' · Campo não reconhecido: '+linha.slice(0,100));}
        else if(ativo){const lista=valores.get(ativo)!;lista[lista.length-1]+='\n'+linha;}
      }
    }
    const estado:ConferenciaFuncao={campos:{} as Record<CampoImportado,EstadoImportacao>,valores:{}};
    const r=rascunhoVazio(funcao.nome);let reconhecidos=0;
    const conflito=partes.some(b=>b.conflito);
    if(conflito)resultado.pendencias.push(id+': código e nome não correspondem ao mesmo texto oficial; identifique a função no PDF antes de preencher.');
    for(const [label,key,opcoes] of definicoes){
      const originais=[...new Set((valores.get(key)??[]).map(v=>v.trim()).filter(v=>!vazios.includes(normal(v))))];
      estado.valores![key]=originais.slice(0,10).map(v=>v.slice(0,2000));
      const equivalentes=[...new Set(originais.map(normal))];const valor=originais[0];
      if(conflito||equivalentes.length>1||originais.some(v=>v.includes('�')||v.length>20000)){
        estado.campos[key]='ambiguo';if(!conflito)resultado.pendencias.push(id+' · '+label+': conteúdo divergente ou parcialmente legível; escolha ou corrija a resposta.');continue;
      }
      if(!valor){estado.campos[key]='ausente';continue;}
      if(opcoes){const opcao=(opcoes as readonly string[]).find(o=>normal(o)===normal(valor));
        if(opcao){r[key]=opcao;estado.campos[key]='reconhecido';reconhecidos++;}else {estado.campos[key]='ambiguo';resultado.pendencias.push(id+' · '+label+': valor não reconhecido; confira no PDF.');}
      }else {r[key]=valor;estado.campos[key]='reconhecido';reconhecidos++;}
    }
    resultado.conferencia[id]=estado;if(reconhecidos)resultado.respostas[id]=r;
  }
  return resultado;
}
export function validarConferencia(estado:ConferenciaFuncao,rascunho:RascunhoMatriz,decisoes:DecisoesImportacao,confirmado:boolean){
  if(confirmado!==true)throw new Error('Confirme a conferência da função antes de salvar.');
  if(!estado?.campos||!decisoes||typeof decisoes!=='object'||Array.isArray(decisoes)||Object.entries(decisoes).some(([c,d])=>!CAMPOS_IMPORTACAO.includes(c as CampoImportado)||!['corrigido','nao_identificado'].includes(d??'')))throw new Error('Decisões de conferência inválidas.');
  for(const campo of CAMPOS_IMPORTACAO)if(estado.campos[campo]==='ambiguo'){
    const decisao=decisoes[campo];
    if(decisao==='nao_identificado'&&rascunho[campo]===null)continue;
    if(decisao==='corrigido'&&typeof rascunho[campo]==='string'&&rascunho[campo]!.trim())continue;
    throw new Error('Resolva a ambiguidade em '+rotulos[campo]+' ou indique que o dado não foi identificado.');
  }
}
