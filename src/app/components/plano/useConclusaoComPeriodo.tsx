import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Activity } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import { atividadesSemPeriodo, errosPeriodoConclusao, dataConclusaoValida, type ConclusaoPlanoInput, type PeriodoConclusao } from '../../lib/conclusaoPlano';
import { PopupDetalhe } from '../PopupDetalhe';

type Alvo = Pick<ConclusaoPlanoInput, 'tipo' | 'id'>;
interface Pedido { alvo: Alvo; atividades: Activity[]; periodos: PeriodoConclusao[] }

/** Mesma regra para a árvore e para os detalhes de meta, etapa e atividade. */
export function useConclusaoComPeriodo(aoOcupar?: (ocupado: boolean) => void) {
  const { readOnly } = useAuth();
  const { setConclusaoPlano } = useStore();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const emCurso = useRef(false);
  const aguardando = useRef(false);
  const liberar = () => { aguardando.current = false; aoOcupar?.(false); };
  const gravar = async (alvo: Alvo, concluido: boolean, periodos: PeriodoConclusao[] = []) => {
    if (readOnly || emCurso.current) return;
    emCurso.current = true; setSalvando(true); aoOcupar?.(true);
    try {
      await setConclusaoPlano({ ...alvo, concluido, ...(periodos.length ? { periodos } : {}) });
      setPedido(null); setErros([]); liberar();
      toast.success(concluido ? 'Conclusão salva.' : 'Retornado para Em andamento.');
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Não foi possível salvar a conclusão.';
      setErros([mensagem]); toast.error(mensagem);
      if (!aguardando.current) liberar();
    } finally { emCurso.current = false; setSalvando(false); }
  };
  const solicitar = (alvo: Alvo, concluido: boolean, atividades: Activity[]) => {
    if (readOnly || emCurso.current || aguardando.current || !atividades.length) return;
    const pendentes = concluido ? atividadesSemPeriodo(atividades) : [];
    if (!pendentes.length) { void gravar(alvo, concluido); return; }
    aguardando.current = true; aoOcupar?.(true); setErros([]);
    setPedido({ alvo, atividades: pendentes, periodos: pendentes.map(a => ({
      id: a.id, inicioRealizado: a.actualStart ?? '', fimRealizado: a.actualEnd ?? '',
      antes: { inicioRealizado: a.actualStart ?? null, fimRealizado: a.actualEnd ?? null },
    })) });
  };
  const cancelar = () => { if (emCurso.current) return; setPedido(null); setErros([]); liberar(); };
  const confirmar = () => {
    if (!pedido) return;
    const problemas = pedido.periodos.flatMap((p, i) => errosPeriodoConclusao(p.inicioRealizado, p.fimRealizado).map(e => `${pedido.atividades[i].name}: ${e}`));
    if (problemas.length) { setErros(problemas); return; }
    void gravar(pedido.alvo, true, pedido.periodos);
  };
  const dialogo = pedido && <PopupDetalhe titulo="Preencher período realizado" descricao="A conclusão só será confirmada após regularizar todas as atividades abaixo. Cancelar mantém os dados e a marcação anteriores."
    aoFechar={cancelar} bloqueado={salvando}>
    <div className="space-y-4">
      {erros.length > 0 && <ul role="alert" className="text-sm text-destructive">{erros.map(e => <li key={e}>{e}</li>)}</ul>}
      {pedido.atividades.map((a, i) => {
        const periodo = pedido.periodos[i];
        const invertido = !!a.actualStart && !!a.actualEnd && a.actualEnd < a.actualStart;
        return <fieldset key={a.id} disabled={salvando} className="border rounded-lg p-3 space-y-2">
          <legend className="text-sm font-medium px-1">{a.name}</legend>
          <p className="text-xs text-muted-foreground">{errosPeriodoConclusao(periodo.inicioRealizado, periodo.fimRealizado).join(' ') || 'Período válido.'}</p>
          <div className="grid sm:grid-cols-2 gap-3">{(['inicioRealizado','fimRealizado'] as const).map(campo => {
            const rotulo = campo === 'inicioRealizado' ? 'Início realizado' : 'Fim realizado';
            const valorAnterior = campo === 'inicioRealizado' ? a.actualStart : a.actualEnd;
            return <label key={campo} className="text-xs flex flex-col gap-1">{rotulo}
              <input type="date" required aria-label={`${rotulo}: ${a.name}`} value={periodo[campo]}
                readOnly={!invertido && dataConclusaoValida(valorAnterior)}
                className="rounded border bg-card p-2 text-sm read-only:bg-muted"
                onChange={e => { const valor = e.target.value; setPedido(atual => atual && ({ ...atual,
                  periodos: atual.periodos.map(p => p.id === a.id ? { ...p, [campo]: valor } : p),
                })); setErros([]); }} />
            </label>;
          })}</div>
        </fieldset>;
      })}
      <div className="flex justify-end gap-2">
        <button type="button" disabled={salvando} onClick={cancelar} className="border rounded-lg p-2 text-sm">Cancelar</button>
        <button type="button" disabled={salvando} onClick={confirmar} className="rounded-lg p-2 text-sm bg-primary text-primary-foreground">{salvando ? 'Salvando…' : 'Confirmar conclusão'}</button>
      </div>
    </div>
  </PopupDetalhe>;
  return { solicitar, ocupado: salvando || pedido !== null, salvando, dialogo };
}
