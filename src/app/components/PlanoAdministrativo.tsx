import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import type { Activity, Deliverable, Goal } from '../data/mockData';
import { metasAdministrativas, numeroAdministrativo, patchAtividadeAdministrativa, statusDoCronograma } from '../lib/planoAdministrativo';
import { codigosHierarquicos, filtrarPlano, idsRecolhiveis, recolhidosDe, CRITERIOS_VAZIOS, temFiltroAtivo, validarMeta, validarPeriodoDaEtapa, type CriteriosFiltro, type EscalaGantt } from '../lib/planoTrabalho';
import { BarraFiltros } from './plano/BarraFiltros';
import { VisaoTabela } from './plano/VisaoTabela';
import { VisaoGantt } from './plano/VisaoGantt';
import { VisaoKanban, type AgrupamentoKanban } from './plano/VisaoKanban';
import { FormularioAtividade } from './plano/FormularioAtividade';
import { Painel, Linha } from './plano/PainelBase';
import { Acoes, Campo, Data, Erros, Texto, AreaTexto } from './plano/camposFormulario';

type Alvo = { tipo: 'meta' | 'etapa' | 'atividade'; id: string } | null;

export function PlanoAdministrativo() {
  const store = useStore();
  const { readOnly } = useAuth();
  const metas = useMemo(() => metasAdministrativas(store.gantt), [store.gantt]);
  const codigos = useMemo(() => codigosHierarquicos(metas), [metas]);
  const [visao, setVisao] = useState<'tabela' | 'gantt' | 'kanban'>('tabela');
  const [escala, setEscala] = useState<EscalaGantt>('mes');
  const [agrupamento, setAgrupamento] = useState<AgrupamentoKanban>('status');
  const [criterios, setCriterios] = useState<CriteriosFiltro>(CRITERIOS_VAZIOS);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [alvo, setAlvo] = useState<Alvo>(null);
  const recolhiveis = idsRecolhiveis(metas);
  const filtradas = filtrarPlano(metas, [], criterios);
  const alternar = (id: string) => setExpandidos(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const abrirMeta = (m: Goal) => setAlvo({ tipo: 'meta', id: m.id });
  const abrirEtapa = (e: Deliverable) => setAlvo({ tipo: 'etapa', id: e.id });
  const abrirAtividade = (a: Activity) => setAlvo({ tipo: 'atividade', id: a.id });
  const props = {
    metas: filtradas, riscos: [], codigos, aoAbrirEtapa: abrirEtapa,
    aoAbrirAtividade: abrirAtividade, aoAbrirAnexo: () => toast.info('Este registro administrativo não tem anexo.'),
  };
  const meta = metas.find(m => m.id === alvo?.id || m.deliverables.some(e => e.id === alvo?.id || e.activities.some(a => a.id === alvo?.id)));
  const etapa = meta?.deliverables.find(e => e.id === alvo?.id || e.activities.some(a => a.id === alvo?.id));
  const atividade = etapa?.activities.find(a => a.id === alvo?.id);
  const fechar = () => setAlvo(null);
  const exigirEscrita = () => { if (readOnly) throw new Error('Seu perfil permite apenas consulta.'); };
  const salvarAtividade = (id: number, patch: Partial<typeof store.gantt[number]['entregas'][number]['atividades'][number]>) => {
    exigirEscrita();
    store.salvarPlanoAdministrativo(store.gantt.map(b => ({ ...b, entregas: b.entregas.map(e => ({ ...e, atividades: e.atividades.map(a => a.id === id ? { ...a, ...patch } : a) })) })));
  };
  return <section aria-label="Plano de Trabalho administrativo" className="space-y-3">
    <p className="text-sm text-muted-foreground">Projeto administrativo · Meta &gt; Etapa &gt; Atividade &gt; Tarefa. Os registros deste cronograma são guardados neste navegador.</p>
    <BarraFiltros metas={metas} criterios={criterios} aoMudar={c => {
      if (!temFiltroAtivo(criterios) && temFiltroAtivo(c)) setExpandidos(new Set(recolhiveis)); setCriterios(c);
    }} visiveis={filtradas.flatMap(m => m.deliverables.flatMap(e => e.activities)).length} total={metas.flatMap(m => m.deliverables.flatMap(e => e.activities)).length} />
    {visao !== 'kanban' && <button className="border rounded px-3 py-2 text-sm" onClick={() => setExpandidos(recolhiveis.every(id => expandidos.has(id)) ? new Set() : new Set(recolhiveis))}>
      {recolhiveis.every(id => expandidos.has(id)) ? 'Recolher tudo' : 'Expandir tudo'}
    </button>}
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Visões do plano administrativo">
      {(['tabela', 'gantt', 'kanban'] as const).map(v => <button key={v} aria-pressed={visao === v} onClick={() => setVisao(v)} className="border rounded px-3 py-2 text-sm" style={{ background: visao === v ? 'var(--brand-soft)' : undefined }}>{v === 'tabela' ? 'Tabela' : v === 'gantt' ? 'Gantt' : 'Kanban'}</button>)}
      {visao === 'gantt' && <label>Escala <select value={escala} onChange={e => setEscala(e.target.value as EscalaGantt)}><option value="mes">Mês</option><option value="trimestre">Trimestre</option></select></label>}
      {visao === 'kanban' && <label>Agrupar <select value={agrupamento} onChange={e => setAgrupamento(e.target.value as AgrupamentoKanban)}><option value="status">Por status</option><option value="responsavel">Por responsável</option></select></label>}
    </div>
    <div className="border rounded-xl overflow-hidden">
      {visao === 'tabela' && <VisaoTabela {...props} recolhidos={recolhidosDe(recolhiveis, expandidos)} alternarRecolhido={alternar} aoAbrirMeta={abrirMeta} aoAbrirRisco={() => {}} />}
      {visao === 'gantt' && <VisaoGantt {...props} escala={escala} recolhidos={recolhidosDe(recolhiveis, expandidos)} alternarRecolhido={alternar} />}
      {visao === 'kanban' && <VisaoKanban {...props} agrupamento={agrupamento} aoMoverStatus={async (a, status) => {
        try { salvarAtividade(numeroAdministrativo(a.id), { status: statusDoCronograma(status), progress: status === 'Concluído' ? 100 : status === 'A iniciar' ? 0 : Math.min(99, a.progress) }); }
        catch (e) { toast.error((e as Error).message); }
      }} aoMoverResponsavel={async (a, responsavel) => {
        try { salvarAtividade(numeroAdministrativo(a.id), { responsavel }); }
        catch (e) { toast.error((e as Error).message); }
      }} />}
    </div>
    {alvo && meta && <Painel titulo={atividade?.name ?? etapa?.name ?? meta.name} caminho={`Gestão Interna > Projeto > ${codigos.get(alvo.id) ?? ''}`} aoFechar={fechar}>
      {alvo.tipo === 'atividade' && atividade && etapa ? <>
        <fieldset disabled={readOnly}>
          <FormularioAtividade key={atividade.id} atividade={atividade} etapa={etapa} aoFechar={fechar} aoSalvar={form => {
            exigirEscrita(); const atual = store.gantt.flatMap(b => b.entregas.flatMap(e => e.atividades)).find(a => a.id === numeroAdministrativo(atividade.id));
            if (!atual) throw new Error('Registro administrativo não encontrado.');
            salvarAtividade(atual.id, patchAtividadeAdministrativa(form, atual));
          }} />
        </fieldset>
        <Linha rotulo="Tarefas">{atividade.tasks.length ? atividade.tasks.map(t => <div key={t.id}>{t.title}</div>) : 'Não informado'}</Linha>
      </> : <EditarNivel key={alvo.id} meta={meta} etapa={alvo.tipo === 'etapa' ? etapa : undefined} readOnly={readOnly} aoFechar={fechar} aoSalvar={patch => {
        exigirEscrita();
        if (alvo.tipo === 'meta') store.salvarPlanoAdministrativo(store.gantt.map(b => b.id === numeroAdministrativo(meta.id) ? { ...b, bloco: patch.name, plano: patch } : b));
        else if (etapa) store.salvarPlanoAdministrativo(store.gantt.map(b => ({ ...b, entregas: b.entregas.map(e => e.id === numeroAdministrativo(etapa.id) ? { ...e, entrega: patch.name, inicio: patch.plannedStart ?? '', fim: patch.plannedEnd ?? '', plano: patch } : e) })));
      }} />}
    </Painel>}
  </section>;
}

function EditarNivel({ meta, etapa, readOnly, aoSalvar, aoFechar }: {
  meta: Goal; etapa?: Deliverable; readOnly: boolean; aoSalvar: (p: Omit<Goal, 'id' | 'deliverables' | 'order'> & { actualStart?: string | null; actualEnd?: string | null; expectedResult?: string }) => void; aoFechar: () => void;
}) {
  const [form, setForm] = useState({ name: etapa?.name ?? meta.name, responsible: meta.responsible ?? '', plannedStart: (etapa ?? meta).plannedStart ?? null, plannedEnd: (etapa ?? meta).plannedEnd ?? null, actualStart: etapa?.actualStart ?? null, actualEnd: etapa?.actualEnd ?? null, expectedResult: etapa?.expectedResult ?? '' });
  const [erros, setErros] = useState<string[]>([]);
  const campo = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }));
  return <div className="space-y-3">
    <Erros erros={erros} />
    <Campo rotulo="Título" obrigatorio><Texto valor={form.name} aoMudar={v => campo('name', v)} desabilitado={readOnly} /></Campo>
    {!etapa && <Campo rotulo="Responsável"><Texto valor={form.responsible} aoMudar={v => campo('responsible', v)} desabilitado={readOnly} /></Campo>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Campo rotulo="Início previsto" obrigatorio={!!etapa}><Data valor={form.plannedStart} aoMudar={v => campo('plannedStart', v)} desabilitado={readOnly} /></Campo>
      <Campo rotulo="Fim previsto" obrigatorio={!!etapa}><Data valor={form.plannedEnd} aoMudar={v => campo('plannedEnd', v)} desabilitado={readOnly} /></Campo>
      {etapa && <><Campo rotulo="Início"><Data valor={form.actualStart} aoMudar={v => campo('actualStart', v)} desabilitado={readOnly} /></Campo><Campo rotulo="Fim"><Data valor={form.actualEnd} aoMudar={v => campo('actualEnd', v)} desabilitado={readOnly} /></Campo></>}
    </div>
    {etapa && <Campo rotulo="Resultado esperado"><AreaTexto valor={form.expectedResult} aoMudar={v => campo('expectedResult', v)} desabilitado={readOnly} /></Campo>}
    {!readOnly && <Acoes aoCancelar={aoFechar} aoSalvar={() => {
      const problemas = validarMeta({ nome: form.name, responsavel: form.responsible, inicioPrevisto: form.plannedStart, fimPrevisto: form.plannedEnd }).erros;
      if (etapa) {
        if (!form.plannedStart || !form.plannedEnd) problemas.push('Informe o início e o fim previstos da etapa.');
        problemas.push(...validarPeriodoDaEtapa({ inicio: form.plannedStart, fim: form.plannedEnd }, etapa.activities).erros);
        if (form.actualStart && form.actualEnd && form.actualStart > form.actualEnd) problemas.push('O início realizado não pode ser posterior ao fim.');
      }
      if (problemas.length) { setErros(problemas); return; }
      try { aoSalvar(form); toast.success('Registro administrativo atualizado.'); aoFechar(); }
      catch (e) { setErros([(e as Error).message]); }
    }} />}
  </div>;
}
