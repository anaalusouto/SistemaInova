import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Activity, Goal } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import { resumirConclusao, type TipoConclusaoPlano } from '../../lib/conclusaoPlano';
import { CheckConclusaoPlano } from './CheckConclusaoPlano';

export interface SelecaoPlano { tipo: TipoConclusaoPlano; id: string }

function RegistroDaArvore({ tipo, id, nome, codigo, atividades, selecionado, ocupado, readOnly, aoAbrir, aoConcluir }: {
  tipo: TipoConclusaoPlano; id: string; nome: string; codigo?: string; atividades: Activity[];
  selecionado: SelecaoPlano; ocupado: boolean; readOnly: boolean;
  aoAbrir: (selecao: SelecaoPlano) => void; aoConcluir: (selecao: SelecaoPlano, concluido: boolean) => void;
}) {
  const resumo = resumirConclusao(atividades);
  const atual = selecionado.tipo === tipo && selecionado.id === id;
  return <div className="flex items-start gap-2 rounded-lg px-2 py-2" style={{ background: atual ? 'var(--brand-soft)' : undefined }}>
    <span className="pt-1"><CheckConclusaoPlano tipo={tipo} nome={nome} resumo={resumo} compacto
      desativado={readOnly || ocupado} salvando={ocupado} aoMudar={concluido => aoConcluir({ tipo, id }, concluido)} /></span>
    <button type="button" disabled={ocupado} aria-current={atual ? 'page' : undefined} aria-label={`Abrir ${tipo}: ${nome}`}
      onClick={() => aoAbrir({ tipo, id })} className="min-w-0 flex-1 text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
      <span className="block text-[10px] uppercase tracking-wide" style={{ color: 'var(--ink-4)' }}>{tipo} {codigo}</span>
      <span className={`block text-xs break-words ${resumo.concluido ? 'line-through' : ''}`} style={{ color: atual ? 'var(--brand)' : 'var(--ink-2)' }}>{nome}</span>
      {tipo !== 'atividade' && <span className="block text-[11px] mt-0.5" style={{ color: 'var(--ink-4)' }}>{resumo.concluidas} de {resumo.total} concluídas</span>}
    </button>
  </div>;
}

/** Árvore completa da meta: não herda o recorte dos filtros da visão de origem. */
export function NavegacaoPlano({ meta, selecionado, codigos, aoAbrir, aoOcupar }: {
  meta: Goal; selecionado: SelecaoPlano; codigos: Map<string, string>;
  aoAbrir: (selecao: SelecaoPlano) => void; aoOcupar?: (ocupado: boolean) => void;
}) {
  const { readOnly } = useAuth();
  const { setConclusaoPlano } = useStore();
  const [ocupado, setOcupado] = useState(false);
  const emCurso = useRef(false);
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const concluir = async (alvo: SelecaoPlano, concluido: boolean) => {
    if (readOnly || emCurso.current) return;
    emCurso.current = true; setOcupado(true); aoOcupar?.(true);
    try {
      await setConclusaoPlano({ ...alvo, concluido });
      toast.success(concluido ? 'Conclusão salva.' : 'Retornado para Em andamento.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar a conclusão.'); }
    finally { emCurso.current = false; setOcupado(false); aoOcupar?.(false); }
  };
  const registro = (tipo: TipoConclusaoPlano, id: string, nome: string, atividades: Activity[]) =>
    <RegistroDaArvore tipo={tipo} id={id} nome={nome} codigo={codigos.get(id)} atividades={atividades} selecionado={selecionado}
      ocupado={ocupado} readOnly={readOnly} aoAbrir={alvo => { if (!emCurso.current) aoAbrir(alvo); }} aoConcluir={(alvo, concluido) => void concluir(alvo, concluido)} />;
  return <nav aria-label="Navegação do plano de trabalho" className="space-y-2">
    <p className="px-2 text-xs font-semibold">Nesta meta</p>
    {registro('meta', meta.id, meta.name, meta.deliverables.flatMap(e => e.activities))}
    <ul className="space-y-1">{meta.deliverables.map(etapa => {
      const atual = selecionado.tipo === 'etapa' ? selecionado.id === etapa.id
        : selecionado.tipo === 'atividade' && etapa.activities.some(a => a.id === selecionado.id);
      const aberta = atual || expandidas.has(etapa.id);
      return <li key={etapa.id} className="border-l pl-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start">
          <button type="button" disabled={ocupado || atual} aria-expanded={aberta} aria-label={`${aberta ? 'Recolher' : 'Expandir'} atividades de ${etapa.name}`}
            className="mt-3 rounded p-0.5 disabled:opacity-40" onClick={() => setExpandidas(antes => {
              const depois = new Set(antes); if (depois.has(etapa.id)) depois.delete(etapa.id); else depois.add(etapa.id); return depois;
            })}>{aberta ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</button>
          <div className="min-w-0 flex-1">{registro('etapa', etapa.id, etapa.name, etapa.activities)}</div>
        </div>
        {aberta && <ul className="pl-4 space-y-1">{etapa.activities.map(atividade => <li key={atividade.id}>
          {registro('atividade', atividade.id, atividade.name, [atividade])}
        </li>)}{etapa.activities.length === 0 && <li className="text-xs px-2 py-1" style={{ color: 'var(--ink-4)' }}>Sem atividades.</li>}</ul>}
      </li>;
    })}</ul>
    <p className="px-2 text-[11px]" style={{ color: 'var(--ink-4)' }}>A bolinha da meta ou etapa conclui todas as atividades do grupo. Desmarcar volta para Em andamento.</p>
    {ocupado && <p role="status" className="px-2 text-xs">Salvando conclusão…</p>}
  </nav>;
}
