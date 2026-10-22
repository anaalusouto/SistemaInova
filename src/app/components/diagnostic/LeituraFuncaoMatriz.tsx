import { leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';
import type { RascunhoMatriz } from '../../diagnostic/importarMatriz';
import { Campo } from './DiagnosticUI';

export function LeituraFuncaoMatriz({valores}:{valores:RascunhoMatriz}) {
  return <div className="space-y-2">
    <Campo label="Atuação" valor={valores.atuacao||'Não informado'}/>
    <Campo label="Experiência" valor={valores.experiencia||'Não informado'}/>
    <Campo label="Criticidade atual" valor={valores.criticidade||'Não informado'}/>
    <Campo label="Interesse em desenvolvimento" valor={valores.interesse||'Não informado'}/>
    <Campo label="Leitura orientativa" valor={leituraMatriz(valores.criticidade,valores.experiencia)}/>
    <Campo label="Observação" valor={valores.observacoes||'Não informado'}/>
    <Campo label="Externo" valor={valores.externo||'Não informado'}/>
  </div>;
}
