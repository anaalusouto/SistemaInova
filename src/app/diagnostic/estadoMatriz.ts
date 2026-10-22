import { CAMPOS_IMPORTACAO, validarConferencia, type ConferenciaFuncao, type DecisoesImportacao, type RascunhoMatriz } from './importarMatriz';

export const ESTADOS_MATRIZ = [
  {id:'vazia',rotulo:'Vazia',descricao:'Função oficial sem respostas.'},
  {id:'em_edicao',rotulo:'Em edição',descricao:'Valores em preenchimento ou alteração, ainda não salvos.'},
  {id:'pre_preenchida',rotulo:'Pré-preenchida',descricao:'Respostas do PDF aguardando conferência.'},
  {id:'com_pendencias',rotulo:'Com pendências',descricao:'Campos ausentes, não reconhecidos ou ambíguos precisam de conferência.'},
  {id:'revisada',rotulo:'Revisada',descricao:'Valores confirmados. Confira se o salvamento já foi realizado.'},
] as const;
export type EstadoMatriz=typeof ESTADOS_MATRIZ[number]['id'];
export interface EdicaoMatriz {valores:RascunhoMatriz;decisoes:DecisoesImportacao;confirmado:boolean}
export function estadoFuncaoMatriz({salva,importada,conferencia,edicao,editando=false,readOnly=false}:{
  salva:boolean;importada?:RascunhoMatriz;conferencia?:ConferenciaFuncao;edicao?:EdicaoMatriz;editando?:boolean;readOnly?:boolean;
}):EstadoMatriz {
  const atual=readOnly?undefined:edicao;
  if(importada&&conferencia){
    const valores=atual?.valores??importada,decisoes=atual?.decisoes??{};
    let semAmbiguidade=true;
    try{validarConferencia(conferencia,valores,decisoes,true);}catch{semAmbiguidade=false;}
    if(semAmbiguidade&&atual?.confirmado&&valores.nomeFuncao.trim())return 'revisada';
    if(!semAmbiguidade||CAMPOS_IMPORTACAO.some(c=>conferencia.campos[c]==='ausente'&&!valores[c]?.trim()))return 'com_pendencias';
    return atual?'em_edicao':'pre_preenchida';
  }
  if(atual?.confirmado&&atual.valores.nomeFuncao.trim())return 'revisada';
  if(atual||(!readOnly&&editando))return 'em_edicao';
  return salva?'revisada':'vazia';
}
