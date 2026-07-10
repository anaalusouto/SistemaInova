import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CalendarDays, Route as RouteIcon, X } from 'lucide-react';
import { useStore } from '../store';
import type { CalendarEventType, RotaItem } from '../data/rotas';

const eventTypes: CalendarEventType[] = ['Visita técnica', 'Prazo', 'Logística', 'Reunião', 'Capacitação', 'Outro'];
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export function CronogramaPage() {
  const [tab, setTab] = useState<'rotas' | 'calendario'>('rotas');
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem' }}>Cronograma 2026</h1>
          <p className="text-sm text-muted-foreground">Rotas de campo e calendário anual — INOVA FAS/FUNBIO</p>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            { id: 'rotas', label: 'Rotas', icon: RouteIcon },
            { id: 'calendario', label: 'Calendário 2026', icon: CalendarDays },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors"
                style={{ background: active ? 'var(--primary)' : 'var(--card)', color: active ? '#fff' : 'var(--foreground)', border: '1px solid var(--border)', fontWeight: active ? 600 : 400 }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'rotas' ? <RotasTab /> : <CalendarioTab />}
      </div>
    </div>
  );
}

function RotasTab() {
  const { routes, updateRoute, addRoute, deleteRoute } = useStore();
  const save = (id: number, patch: Partial<RotaItem>) => updateRoute(id, patch);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>Rotas & Organizações</h3>
        <button onClick={() => addRoute({ rota: 'ROTA NOVA', organizacao: '', municipio: '', uf: 'PA', diasAtuacao: 2, modalAcesso: '', tipoComunidade: '', notasLogisticas: '' })}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }}>
          <Plus size={12} /> Adicionar rota
        </button>
      </div>
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)', position: 'sticky', top: 0 }}>
            <tr className="text-left text-xs">
              <th className="px-3 py-2">Rota</th>
              <th className="px-3 py-2">Organização</th>
              <th className="px-3 py-2">Município/UF</th>
              <th className="px-3 py-2">Dias</th>
              <th className="px-3 py-2">Modal</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Notas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <Td><input className="cell" value={r.rota} onChange={e => save(r.id, { rota: e.target.value })} /></Td>
                <Td><input className="cell" value={r.organizacao} onChange={e => save(r.id, { organizacao: e.target.value })} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <input className="cell" style={{ flex: 1 }} value={r.municipio} onChange={e => save(r.id, { municipio: e.target.value })} />
                    <input className="cell" style={{ width: 48 }} value={r.uf} onChange={e => save(r.id, { uf: e.target.value })} />
                  </div>
                </Td>
                <Td><input type="number" className="cell" style={{ width: 60 }} value={r.diasAtuacao} onChange={e => save(r.id, { diasAtuacao: Number(e.target.value) })} /></Td>
                <Td><input className="cell" value={r.modalAcesso} onChange={e => save(r.id, { modalAcesso: e.target.value })} /></Td>
                <Td><input className="cell" value={r.tipoComunidade} onChange={e => save(r.id, { tipoComunidade: e.target.value })} /></Td>
                <Td><input className="cell" value={r.notasLogisticas} onChange={e => save(r.id, { notasLogisticas: e.target.value })} /></Td>
                <Td>
                  <button onClick={() => { if (confirm(`Excluir ${r.rota} — ${r.organizacao}?`)) { deleteRoute(r.id); toast.success('Rota excluída'); } }} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.cell{border:1px solid transparent;border-radius:6px;padding:4px 8px;font-size:12.5px;background:transparent;width:100%;color:#0F172A}
        .cell:focus{border-color:var(--primary);background:#fff;outline:none}
        .cell:hover{background:#fff}`}</style>
    </div>
  );
}

function CalendarioTab() {
  const { events, addEvent, updateEvent, deleteEvent, routes, communities } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const byMonth = useMemo(() => {
    const map: Record<number, typeof events> = {};
    events.forEach(e => {
      const m = Number((e.date ?? '').split('-')[1]) - 1;
      if (m >= 0 && m < 12) { (map[m] ??= []).push(e); }
    });
    Object.values(map).forEach(list => list.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [events]);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }}>
          <Plus size={12} /> Novo evento
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {meses.map((nome, i) => {
          const list = byMonth[i] ?? [];
          return (
            <div key={i} className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-2 border-b flex items-center justify-between" style={{ background: '#F8FAFC', borderColor: 'var(--border)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{nome} 2026</span>
                <span className="text-xs text-muted-foreground">{list.length}</span>
              </div>
              <div className="p-3 space-y-2 max-h-[240px] overflow-y-auto">
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sem eventos.</p>
                ) : list.map(e => (
                  <button key={e.id} onClick={() => { setEditing(e.id); setShowForm(true); }} className="w-full text-left rounded p-2 hover:bg-slate-50" style={{ background: '#F8FAFC' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono">{e.date.slice(-2)}/{e.date.slice(5,7)}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#EFF6FF', color: '#2563EB' }}>{e.type}</span>
                    </div>
                    <div className="text-xs font-medium">{e.title}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <EventForm
          initial={editing != null ? events.find(x => x.id === editing) : undefined}
          routes={routes} communities={communities}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing != null) { updateEvent(editing, data); toast.success('Evento atualizado.'); }
            else { addEvent(data); toast.success('Evento criado.'); }
            setShowForm(false);
          }}
          onDelete={editing != null ? () => { deleteEvent(editing); toast.success('Evento excluído.'); setShowForm(false); } : undefined}
        />
      )}
    </div>
  );
}

function EventForm({ initial, routes, communities, onSave, onClose, onDelete }: {
  initial?: { id: number; title: string; date: string; type: CalendarEventType; rotaId?: number | null; comunidadeId?: number | null; responsavel?: string; observacoes?: string };
  routes: RotaItem[];
  communities: { id: number; nome: string }[];
  onSave: (data: { title: string; date: string; type: CalendarEventType; rotaId?: number | null; comunidadeId?: number | null; responsavel?: string; observacoes?: string }) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? '2026-01-01',
    type: initial?.type ?? 'Reunião' as CalendarEventType,
    rotaId: initial?.rotaId ?? null,
    comunidadeId: initial?.comunidadeId ?? null,
    responsavel: initial?.responsavel ?? '',
    observacoes: initial?.observacoes ?? '',
  });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3>{initial ? 'Editar evento' : 'Novo evento'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} min="2026-01-01" max="2026-12-31" className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEventType })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                {eventTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rota</label>
              <select value={form.rotaId ?? ''} onChange={e => setForm({ ...form, rotaId: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                <option value="">—</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.rota} · {r.organizacao}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Comunidade</label>
              <select value={form.comunidadeId ?? ''} onChange={e => setForm({ ...form, comunidadeId: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                <option value="">—</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Responsável</label>
            <input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex justify-between mt-5">
          {onDelete ? <button onClick={onDelete} className="text-xs text-red-600">Excluir evento</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ border: '1px solid var(--border)' }}>Cancelar</button>
            <button onClick={() => { if (!form.title) { toast.error('Informe o título'); return; } onSave(form); }} className="px-4 py-2 text-sm text-white rounded-md" style={{ background: 'var(--primary)' }}>
              <Save size={13} className="inline mr-1" /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2 align-middle">{children}</td>; }
