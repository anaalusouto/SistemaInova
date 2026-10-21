import { ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, FUNCOES_MATRIZ, NIVEIS_MATRIZ, type MatrizPrototipoInput } from './catalog/matrizPrototipo';

export type RascunhoMatriz = Omit<MatrizPrototipoInput, 'organizacaoId' | 'diagnosticoId' | 'funcaoId'>;
export type CampoImportado=Exclude<keyof RascunhoMatriz,'nomeFuncao'>;
export type EstadoImportacao='reconhecido'|'ausente'|'ambiguo';
export interface ConferenciaFuncao { campos: Record<CampoImportado,EstadoImportacao> }
export interface ImportacaoMatriz { respostas: Record<string,RascunhoMatriz>; pendencias: string[]; conferencia:Record<string,ConferenciaFuncao> }
const conferenciaVazia=():ConferenciaFuncao=>({campos:{atuacao:'ausente',experiencia:'ausente',criticidade:'ausente',interesse:'ausente',observacoes:'ausente',externo:'ausente'}});
const normalizar=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const campos = [
  ['Atuação','atuacao',ATUACAO_MATRIZ], ['Experiência','experiencia',EXPERIENCIA_MATRIZ],
  ['Criticidade atual','criticidade',NIVEIS_MATRIZ], ['Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ],
  ['Leitura orientativa',null,null], ['Observação','observacoes',null], ['Externo','externo',null],
] as const;

/** Só associa funções identificadas explicitamente; não adivinha respostas ambíguas. */
export function interpretarTextoMatriz(texto:string):ImportacaoMatriz {
  const respostas:Record<string,RascunhoMatriz>={},pendencias:string[]=[],conferencia:Record<string,ConferenciaFuncao>={};
  const linhas=texto.replace(/\r/g,'').split('\n');
  const blocos:{id:string;linhas:string[]}[]=[];
  for(const linha of linhas) {
    const codigo=/^\s*(?:Função\s*:?\s*)?(F\d{2})\b(?:\s*[-–—.:]?\s*)/i.exec(linha)?.[1]?.toUpperCase();
    const funcao=FUNCOES_MATRIZ.find(f=>codigo?f.id===codigo:normalizar(linha.replace(/^Função\s*:\s*/i,''))===normalizar(f.nome));
    if(funcao)blocos.push({id:funcao.id,linhas:[]});
    else if(codigo)blocos.push({id:codigo,linhas:[]});
    else blocos.at(-1)?.linhas.push(linha);
  }
  for(const bloco of blocos) {
    const funcao=FUNCOES_MATRIZ.find(f=>f.id===bloco.id);
    if(!funcao) {pendencias.push(`${bloco.id}: função fora do catálogo atual.`);continue;}
    if(blocos.filter(b=>b.id===bloco.id).length>1) {
      conferencia[bloco.id]={campos:{atuacao:'ambiguo',experiencia:'ambiguo',criticidade:'ambiguo',interesse:'ambiguo',observacoes:'ambiguo',externo:'ambiguo'}};
      if(!pendencias.some(p=>p.startsWith(`${bloco.id}:`)))pendencias.push(`${bloco.id}: aparece mais de uma vez; preencha após conferir o PDF.`);continue;
    }
    const estado=conferencia[bloco.id]=conferenciaVazia();
    const r:RascunhoMatriz={nomeFuncao:funcao.nome,atuacao:null,experiencia:null,criticidade:null,interesse:null,observacoes:null,externo:null};
    const valores=new Map<string,string[]>();let ativo:string|null=null;
    for(const linha of bloco.linhas) {
      const parte=linha.indexOf(':');const label=normalizar(parte>=0?linha.slice(0,parte):linha);
      const campo=campos.find(([nome])=>normalizar(nome)===label || (nome==='Observação'&&label==='observacoes'));
      if(campo) {ativo=campo[0];const lista=valores.get(ativo)??[];lista.push(parte>=0?linha.slice(parte+1).trim():'');valores.set(ativo,lista);}
      else if(ativo) {const lista=valores.get(ativo)!;lista[lista.length-1]+=`\n${linha}`;}
    }
    let reconhecidos=0;
    for(const [label,key,opcoes] of campos) {
      if(!key)continue;
      const valoresCampo=valores.get(label),valor=valoresCampo?.[0]?.trim();
      if(valoresCampo && valoresCampo.length>1) {estado.campos[key]='ambiguo';pendencias.push(`${bloco.id} · ${label}: mais de um valor; confira no PDF.`);continue;}
      if(!valor || ['nao informado','—','-'].includes(normalizar(valor)))continue;
      if(opcoes) {
        const opcao=(opcoes as readonly string[]).find(o=>normalizar(o)===normalizar(valor));
        if(opcao){r[key]=opcao;estado.campos[key]='reconhecido';reconhecidos++;}else {estado.campos[key]='ambiguo';pendencias.push(`${bloco.id} · ${label}: valor não reconhecido (${valor.slice(0,100)}).`);}
      } else if(valor.length<=20000){r[key]=valor;estado.campos[key]='reconhecido';reconhecidos++;}else {estado.campos[key]='ambiguo';pendencias.push(`${bloco.id} · ${label}: texto excede o limite do campo.`);}
    }
    if(reconhecidos)respostas[bloco.id]=r;
  }
  return {respostas,pendencias,conferencia};
}
