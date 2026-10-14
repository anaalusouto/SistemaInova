import { useEffect, useRef } from 'react';
import type { TarefaGestao } from '../tarefasGestao.server';
import { ativarFocoMenu } from '../lib/focoMenu';

export function DetalheTarefaVinculada({ tarefa, aoFechar, aoProjeto, aoOrganizacao, aoAdministrativo }: {
  tarefa: TarefaGestao; aoFechar: () => void; aoProjeto?: (id: number) => void;
  aoOrganizacao?: (id: string, foco: string) => void; aoAdministrativo?: () => void;
}) {
  const dialogo = useRef<HTMLDivElement>(null);
  const fecharRef = useRef(aoFechar); fecharRef.current = aoFechar;
  useEffect(() => dialogo.current ? ativarFocoMenu(dialogo.current, () => fecharRef.current()) : undefined, []);
  const o = tarefa.origem;
  const abrir = o?.organizacaoId && aoOrganizacao ? () => aoOrganizacao(o.organizacaoId!, o.registroId)
    : o?.tipo === 'administrativo' && aoAdministrativo ? aoAdministrativo
    : o?.projetoId && aoProjeto ? () => aoProjeto(o.projetoId!) : null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }}>
    <div ref={dialogo} role="dialog" aria-modal="true" aria-label="Detalhes da tarefa" className="bg-card border rounded-xl p-5 w-full max-w-xl max-h-[90dvh] overflow-y-auto space-y-3">
      <h2 className="font-semibold">{tarefa.titulo}</h2>
      <p>Responsável: {tarefa.atribuidoParaNome}</p>
      <p>Criada por: {tarefa.atribuidoPorNome || 'Não informado'}</p>
      <p>Prazo: {tarefa.dataLimite || 'Não informado'}</p>
      <p className="text-sm">{o?.caminho}</p>
      <p className="text-sm">Esta tarefa acompanha o registro de origem. Alterações feitas lá aparecem automaticamente neste quadro.</p>
      <div className="flex justify-end gap-3">
        <button onClick={aoFechar}>Fechar</button>
        {abrir && <button className="border rounded px-3 py-2" onClick={abrir}>Abrir origem</button>}
      </div>
    </div>
  </div>;
}
