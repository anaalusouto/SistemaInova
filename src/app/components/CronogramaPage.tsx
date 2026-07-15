import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CalendarDays, Route as RouteIcon, X, ChevronLeft, ChevronRight, MapPin, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store';
import type { CalendarEventType, RotaItem, CalendarEvent } from '../data/rotas';

const eventTypes: CalendarEventType[] = ['Visita técnica', 'Prazo', 'Logística', 'Reunião', 'Capacitação', 'Outro'];
const typeColors: Record<CalendarEventType, string> = {
  'Visita técnica': '#2E7D52',
  'Prazo': '#EF4444',
  'Logística': '#0D6E8A',
  'Reunião': '#7C3AED',
  'Capacitação': '#F59E0B',
  'Outro': '#6B7280',
};
const statusColors: Record<string, string> = {
  'Operacional': '#22C55E',
  'Atenção': '#F59E0B',
  'Crítico': '#EF4444',
};

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export function CronogramaPage() {
  const [tab, setTab] = useState<'rotas' | 'calendario'>('rotas');
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-[1400px] mx-auto">
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

/* ============================================================
   ROTAS TAB — Interactive map + filterable table
   ============================================================ */
function RotasTab() {
  const { routes, updateRoute, addRoute, deleteRoute } = useStore();
  const [selectedRota, setSelectedRota] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rotasUnicas = useMemo(() => Array.from(new Set(routes.map(r => r.rota))).sort(), [routes]);
  const filtered = useMemo(
    () => (selectedRota === 'all' ? routes : routes.filter(r => r.rota === selectedRota)),
    [routes, selectedRota]
  );

  const kpis = useMemo(() => {
    const total = filtered.length;
    const dias = filtered.reduce((a, r) => a + (r.diasAtuacao ?? 0), 0);
    const atencao = filtered.filter(r => r.status === 'Atenção' || r.status === 'Crítico').length;
    const tipos = new Set(filtered.map(r => r.tipoComunidade)).size;
    return { total, dias, atencao, tipos };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Filter size={14} className="text-muted-foreground" />
          <select value={selectedRota} onChange={e => setSelectedRota(e.target.value)}
            className="text-sm bg-transparent outline-none">
            <option value="all">Todas as rotas</option>
            {rotasUnicas.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={() => addRoute({ rota: 'ROTA NOVA', organizacao: '', municipio: '', uf: 'PA', diasAtuacao: 2, modalAcesso: '', tipoComunidade: '', notasLogisticas: '', status: 'Operacional' })}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-md text-white ml-auto" style={{ background: 'var(--primary)' }}>
          <Plus size={12} /> Adicionar rota
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Organizações" value={kpis.total} color="#1A5C3A" />
        <Kpi label="Dias de campo" value={kpis.dias} color="#0D6E8A" />
        <Kpi label="Pontos de atenção" value={kpis.atencao} color="#F59E0B" />
        <Kpi label="Tipos de comunidade" value={kpis.tipos} color="#7C3AED" />
      </div>

      {/* Map + Legend */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>
            <MapPin size={14} className="inline mr-1.5" />Mapa das Rotas — Pará
          </h3>
          <div className="flex gap-3 text-xs">
            {Object.entries(statusColors).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                {s}
              </span>
            ))}
          </div>
        </div>
        <RotasMap routes={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>Organizações & logística</h3>
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--muted)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr className="text-left text-xs">
                <th className="px-3 py-2">Rota</th>
                <th className="px-3 py-2">Organização</th>
                <th className="px-3 py-2">Município/UF</th>
                <th className="px-3 py-2">Dias</th>
                <th className="px-3 py-2">Modal</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="border-t cursor-pointer"
                  style={{ borderColor: 'var(--border)', background: selectedId === r.id ? '#EFF6FF' : undefined }}>
                  <Td><input className="cell" value={r.rota} onChange={e => updateRoute(r.id, { rota: e.target.value })} /></Td>
                  <Td><input className="cell" value={r.organizacao} onChange={e => updateRoute(r.id, { organizacao: e.target.value })} /></Td>
                  <Td>
                    <div className="flex gap-1">
                      <input className="cell" style={{ flex: 1 }} value={r.municipio} onChange={e => updateRoute(r.id, { municipio: e.target.value })} />
                      <input className="cell" style={{ width: 48 }} value={r.uf} onChange={e => updateRoute(r.id, { uf: e.target.value })} />
                    </div>
                  </Td>
                  <Td><input type="number" className="cell" style={{ width: 60 }} value={r.diasAtuacao} onChange={e => updateRoute(r.id, { diasAtuacao: Number(e.target.value) })} /></Td>
                  <Td><input className="cell" value={r.modalAcesso} onChange={e => updateRoute(r.id, { modalAcesso: e.target.value })} /></Td>
                  <Td><input className="cell" value={r.tipoComunidade} onChange={e => updateRoute(r.id, { tipoComunidade: e.target.value })} /></Td>
                  <Td>
                    <select className="cell" value={r.status ?? 'Operacional'} onChange={e => updateRoute(r.id, { status: e.target.value as RotaItem['status'] })}>
                      <option value="Operacional">Operacional</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </Td>
                  <Td><input className="cell" value={r.notasLogisticas} onChange={e => updateRoute(r.id, { notasLogisticas: e.target.value })} /></Td>
                  <Td>
                    <button onClick={(ev) => { ev.stopPropagation(); if (confirm(`Excluir ${r.rota} — ${r.organizacao}?`)) { deleteRoute(r.id); toast.success('Rota excluída'); } }} className="p-1.5 rounded hover:bg-red-50">
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
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

/* Leaflet map with route grouping */
function RotasMap({ routes, selectedId, onSelect }: { routes: RotaItem[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [-3.5, -51], zoom: 5, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current, layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    // Group by rota name for polylines connecting stops
    const groups: Record<string, RotaItem[]> = {};
    routes.forEach(r => { if (r.lat != null && r.lng != null) (groups[r.rota] ??= []).push(r); });

    const palette = ['#1A5C3A', '#0D6E8A', '#F59E0B', '#EF4444', '#7C3AED', '#DB2777', '#059669', '#2563EB', '#B45309', '#0891B2', '#65A30D', '#DC2626'];
    let idx = 0;
    const bounds: L.LatLngExpression[] = [];

    Object.entries(groups).forEach(([rotaName, items]) => {
      const color = palette[idx++ % palette.length];
      const coords: L.LatLngExpression[] = items.map(r => [r.lat!, r.lng!]);
      if (coords.length > 1) {
        L.polyline(coords, { color, weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(layer);
      }
      items.forEach(r => {
        bounds.push([r.lat!, r.lng!]);
        const st = statusColors[r.status ?? 'Operacional'];
        const isSel = r.id === selectedId;
        const marker = L.circleMarker([r.lat!, r.lng!], {
          radius: isSel ? 12 : 8,
          color: '#fff',
          weight: 2,
          fillColor: st,
          fillOpacity: 0.95,
        }).addTo(layer);
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:200px">
            <div style="font-weight:700;color:${color};font-size:12px">${rotaName}</div>
            <div style="font-weight:600;font-size:13px;margin-top:2px">${r.organizacao}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">${r.municipio}/${r.uf}</div>
            <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
              <span style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-size:10px">${r.tipoComunidade}</span>
              <span style="background:${st};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">${r.status ?? 'Operacional'}</span>
            </div>
            <div style="font-size:11px;margin-top:6px"><b>Modal:</b> ${r.modalAcesso}</div>
            <div style="font-size:11px"><b>Dias:</b> ${r.diasAtuacao}</div>
            ${r.notasLogisticas ? `<div style="font-size:10.5px;color:#92400E;background:#FFFBEB;padding:4px 6px;border-radius:4px;margin-top:6px">${r.notasLogisticas}</div>` : ''}
          </div>
        `);
        marker.on('click', () => onSelect(r.id));
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40], maxZoom: 8 });
    }
  }, [routes, selectedId, onSelect]);

  return <div ref={containerRef} style={{ height: 460, width: '100%', zIndex: 0 }} />;
}

/* ============================================================
   CALENDÁRIO TAB — Google Calendar-like (month / week / day)
   ============================================================ */
type CalView = 'month' | 'week' | 'day';

function CalendarioTab() {
  const { events, addEvent, updateEvent, deleteEvent, routes, communities } = useStore();
  const [view, setView] = useState<CalView>('month');
  const [cursor, setCursor] = useState<Date>(new Date(2026, 0, 1));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);

  const openNew = (date?: string) => { setEditing(null); setPrefillDate(date ?? null); setShowForm(true); };
  const openEdit = (id: number) => { setEditing(id); setPrefillDate(null); setShowForm(true); };

  const goPrev = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursor(d);
  };
  const goNext = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursor(d);
  };
  const goToday = () => setCursor(new Date());

  const title = useMemo(() => {
    if (view === 'month') return cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (view === 'day') return cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const start = startOfWeek(cursor);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }, [cursor, view]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-md" style={{ border: '1px solid var(--border)', background: '#fff' }}>Hoje</button>
          <button onClick={goPrev} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronLeft size={16} /></button>
          <button onClick={goNext} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronRight size={16} /></button>
          <div className="text-sm font-semibold ml-2 capitalize">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day', 'week', 'month'] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs px-3 py-1.5 capitalize"
                style={{ background: view === v ? 'var(--primary)' : '#fff', color: view === v ? '#fff' : '#0F172A', fontWeight: view === v ? 600 : 400 }}>
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }}>
            <Plus size={12} /> Novo
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b text-[11px]" style={{ borderColor: 'var(--border)' }}>
        {eventTypes.map(t => (
          <span key={t} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: typeColors[t] }} /> {t}
          </span>
        ))}
      </div>

      {view === 'month' && <MonthView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}
      {view === 'week' && <WeekView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}
      {view === 'day' && <DayView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}

      {showForm && (
        <EventForm
          initial={editing != null ? events.find(x => x.id === editing) : undefined}
          prefillDate={prefillDate}
          routes={routes}
          communities={communities}
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

/* ---- helpers ---- */
function fmtDate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfWeek(d: Date): Date {
  const x = new Date(d); const dow = x.getDay(); x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ---- Month view ---- */
function MonthView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();

  return (
    <div>
      <div className="grid grid-cols-7 border-b text-[11px] font-semibold text-muted-foreground" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        {weekDays.map(w => <div key={w} className="px-2 py-1.5 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[110px] border-b border-r" style={{ borderColor: 'var(--border)', background: '#FAFAFA' }} />;
          const key = fmtDate(d);
          const list = events.filter(e => e.date === key);
          const isToday = isSameDay(d, today);
          return (
            <div key={i}
              onDoubleClick={() => onNew(key)}
              className="min-h-[110px] border-b border-r p-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}>
              <div className={`text-[11px] font-semibold mb-1 flex items-center justify-between ${isToday ? '' : 'text-slate-700'}`}>
                <span style={isToday ? { background: 'var(--primary)', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 } : {}}>{d.getDate()}</span>
                <button onClick={(ev) => { ev.stopPropagation(); onNew(key); }} className="text-slate-300 hover:text-slate-600"><Plus size={11} /></button>
              </div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map(e => (
                  <button key={e.id} onClick={(ev) => { ev.stopPropagation(); onEdit(e.id); }}
                    className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate text-white"
                    title={e.title}
                    style={{ background: typeColors[e.type] }}>
                    {e.startTime ? `${e.startTime} ` : ''}{e.title}
                  </button>
                ))}
                {list.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{list.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Week view ---- */
function WeekView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = new Date();
  return (
    <div className="grid grid-cols-7">
      {days.map(d => {
        const key = fmtDate(d);
        const list = events.filter(e => e.date === key).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
        const isToday = isSameDay(d, today);
        return (
          <div key={key} className="border-r min-h-[500px]" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center py-2 border-b" style={{ borderColor: 'var(--border)', background: isToday ? '#EFF6FF' : '#F8FAFC' }}>
              <div className="text-[10px] uppercase text-muted-foreground">{weekDays[d.getDay()]}</div>
              <div className="text-lg font-bold" style={{ color: isToday ? 'var(--primary)' : undefined }}>{d.getDate()}</div>
            </div>
            <div className="p-2 space-y-1.5" onDoubleClick={() => onNew(key)}>
              {list.length === 0 && <div className="text-[10px] text-muted-foreground italic text-center pt-4">—</div>}
              {list.map(e => (
                <button key={e.id} onClick={() => onEdit(e.id)}
                  className="w-full text-left rounded p-1.5"
                  style={{ background: typeColors[e.type], color: '#fff' }}>
                  <div className="text-[10px] font-mono opacity-90">{e.startTime ?? 'todo o dia'}</div>
                  <div className="text-[11px] font-semibold leading-tight">{e.title}</div>
                  {e.responsavel && <div className="text-[10px] opacity-90 truncate">{e.responsavel}</div>}
                </button>
              ))}
              <button onClick={() => onNew(key)} className="w-full text-[10px] py-1 rounded hover:bg-slate-100 text-slate-400 border border-dashed" style={{ borderColor: 'var(--border)' }}>
                <Plus size={10} className="inline" /> adicionar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Day view ---- */
function DayView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const key = fmtDate(cursor);
  const list = events.filter(e => e.date === key).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="grid grid-cols-[60px_1fr] max-h-[600px] overflow-y-auto">
      {hours.map(h => {
        const hh = String(h).padStart(2, '0');
        const bucket = list.filter(e => (e.startTime ?? '').startsWith(hh));
        return (
          <div key={h} className="contents">
            <div className="text-[10px] text-right pr-2 pt-1 text-muted-foreground border-r border-b" style={{ borderColor: 'var(--border)' }}>{hh}:00</div>
            <div className="border-b p-1 min-h-[48px] hover:bg-slate-50 cursor-pointer" style={{ borderColor: 'var(--border)' }}
              onDoubleClick={() => onNew(key)}>
              {bucket.map(e => (
                <button key={e.id} onClick={() => onEdit(e.id)} className="block w-full text-left rounded p-1.5 mb-1 text-white"
                  style={{ background: typeColors[e.type] }}>
                  <div className="text-[10px] font-mono">{e.startTime}{e.endTime ? ` – ${e.endTime}` : ''}</div>
                  <div className="text-xs font-semibold">{e.title}</div>
                  {e.responsavel && <div className="text-[10px] opacity-90">{e.responsavel}</div>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
          Sem eventos neste dia. <button onClick={() => onNew(key)} className="text-primary underline">Criar evento</button>
        </div>
      )}
    </div>
  );
}

/* ---- Event form modal ---- */
function EventForm({ initial, prefillDate, routes, communities, onSave, onClose, onDelete }: {
  initial?: CalendarEvent;
  prefillDate?: string | null;
  routes: RotaItem[];
  communities: { id: number; nome: string }[];
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? prefillDate ?? '2026-01-01',
    startTime: initial?.startTime ?? '',
    endTime: initial?.endTime ?? '',
    type: initial?.type ?? 'Reunião' as CalendarEventType,
    rotaId: initial?.rotaId ?? null,
    comunidadeId: initial?.comunidadeId ?? null,
    responsavel: initial?.responsavel ?? '',
    observacoes: initial?.observacoes ?? '',
  });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{initial ? 'Editar evento' : 'Novo evento'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Início</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Fim</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEventType })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                {eventTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
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
            <label className="text-xs font-medium block mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex justify-between mt-5">
          {onDelete ? <button onClick={onDelete} className="text-xs text-red-600 flex items-center gap-1"><Trash2 size={12} />Excluir evento</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ border: '1px solid var(--border)' }}>Cancelar</button>
            <button onClick={() => { if (!form.title) { toast.error('Informe o título'); return; } onSave(form); }} className="px-4 py-2 text-sm text-white rounded-md flex items-center gap-1" style={{ background: 'var(--primary)' }}>
              <Save size={13} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2 align-middle">{children}</td>; }
