import { useState } from 'react';
import { QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO, REVISAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { CadernoItens, type ContextoCaderno } from './CadernoItens';
import { IeoTab } from './IeoTab';
export function QuestionarioCaderno(props: ContextoCaderno) {
  const [publico, setPublico] = useState('Todos');
  const grupos = [...new Set(QUESTIONARIO_CADERNO.map(q => q.grupo))];
  return <div className="space-y-5"><div><h3 className="text-2xl font-bold">Questionário</h3><p className="mt-2 text-sm text-muted-foreground">Caderno CRIA · revisão {REVISAO_CADERNO}. Perguntas complementares apenas quando necessárias. N/A exige justificativa de não pertinência.</p></div>
    <div className="flex flex-wrap gap-2" aria-label="Filtrar questionário por público">{['Todos', ...grupos].map(g => <button key={g} type="button" className="diagnostico-filtro" data-active={publico === g} aria-pressed={publico === g} onClick={() => setPublico(g)}>{g}</button>)}</div>
    <CadernoItens {...props} itens={QUESTIONARIO_CADERNO.filter(q => publico === 'Todos' || q.grupo === publico)}/>
    <section className="space-y-3"><h4 className="font-semibold text-lg">Informações complementares e fechamento estratégico</h4><p className="text-sm text-muted-foreground">Não repetir relatos: indicar o código onde a resposta pode ser encontrada. Ouvir gestão e membros. Prioridades são pactuadas e não derivam automaticamente de notas.</p><CadernoItens {...props} itens={COMPLEMENTARES_CADERNO}/></section>
    <details className="rounded-xl border p-4"><summary className="text-sm font-medium cursor-pointer">Consultar IEO anterior — instrumento legado</summary><p className="text-xs text-muted-foreground my-3">As respostas anteriores foram preservadas. Os códigos e as escalas do caderno atual não são convertidos para o IEO legado.</p><IeoTab diagnosticoId={props.diagnosticoId} readOnly/></details>
  </div>;
}
