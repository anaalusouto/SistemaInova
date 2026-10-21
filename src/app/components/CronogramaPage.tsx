import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CalendarDays, Route as RouteIcon, X, ChevronLeft, ChevronRight, MapPin, Filter, GanttChart, Kanban as KanbanIcon, MessageSquare } from 'lucide-react';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { tipoComunidadeColors, type CalendarEventType, type RotaItem, type CalendarEvent } from '../data/rotas';
import { CronogramaExecutivoTab } from './CronogramaExecutivoTab';
import { PlanoAdministrativo } from './PlanoAdministrativo';
import { GestaoPage } from './GestaoPage';
import { MensagensPage } from './MensagensPage';
import 'leaflet/dist/leaflet.css';
import { BotaoNovo, LinkNovo } from './BotaoNovo';
import { CronogramaRotas } from './rotas/CronogramaRotas';
import { chaveRotas, type VisitaRota } from '../lib/cronogramaRotas';
import type { AbaGestao } from '../lib/navegacaoApp';

const eventTypes: CalendarEventType[] = ['Visita técnica', 'Prazo', 'Logística', 'Reunião', 'Capacitação', 'Outro'];
const typeColors: Record<CalendarEventType, string> = {
  'Visita técnica': '#58805B',
  'Prazo': '#B5473C',
  'Logística': '#C47735',
  'Reunião': '#344980',
  'Capacitação': '#D3AD3E',
  'Outro': '#253253',
};
const statusColors: Record<string, string> = {
  'Operacional': 'var(--success)',
  'Atenção': 'var(--warning)',
  'Crítico': 'var(--danger)',
};
const DEFAULT_TIPO_COLOR = 'var(--ink-4)';
const colorForTipo = (t: string) => tipoComunidadeColors[t] ?? DEFAULT_TIPO_COLOR;


type GestaoInternaTab = AbaGestao;

export function CronogramaPage({ onOpenProject, onOpenOrg, abaAtual, aoMudarAba }: { onOpenProject: (projectId: number) => void; onOpenOrg?: (id: string, foco: string) => void; abaAtual?: AbaGestao; aoMudarAba?: (aba: AbaGestao) => void }) {
  const [abaLocal, setAbaLocal] = useState<GestaoInternaTab>('plano');
  const tab = abaAtual ?? abaLocal;
  const setTab = (aba: AbaGestao) => aoMudarAba ? aoMudarAba(aba) : setAbaLocal(aba);
  const nestedPage = tab === 'kanban' || tab === 'mensagens';

  return (
    <div className={`h-full min-h-0 flex flex-col ${nestedPage ? 'overflow-hidden' : 'p-6 overflow-y-auto'}`}>
      <div className={`w-full flex flex-col flex-1 min-h-0 ${nestedPage ? '' : 'max-w-[1500px] mx-auto'}`}>
        {!nestedPage && (
          <div className="mb-3">
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>Projeto</h1>
            <p className="text-sm text-muted-foreground">Cronograma executivo, rotas de campo e calendário anual — INOVA FAS/FUNBIO</p>
          </div>
        )}

        <div className={`flex gap-2 mb-3 shrink-0 flex-wrap ${nestedPage ? 'px-6 pt-6' : ''}`}>
          {[
            { id: 'plano', label: 'Plano de Trabalho', icon: GanttChart },
            { id: 'executivo', label: 'Cronograma Executivo', icon: GanttChart },
            { id: 'rotas', label: 'Rotas', icon: RouteIcon },
            { id: 'calendario', label: 'Calendário 2026', icon: CalendarDays },
            { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
            { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as GestaoInternaTab)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors"
                style={{ background: active ? 'var(--primary)' : 'var(--card)', color: active ? 'var(--primary-foreground)' : 'var(--foreground)', border: '1px solid var(--border)', fontWeight: active ? 600 : 400 }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'plano' && <PlanoAdministrativo />}
        {tab === 'executivo' && (
          <div className="flex-1 min-h-0"><CronogramaExecutivoTab /></div>
        )}
        {tab === 'rotas' && <CronogramaRotas renderMapa={visitas => <MapaCronogramaRotas visitas={visitas} />} />}
        {tab === 'calendario' && <CalendarioTab />}
        {tab === 'kanban' && (
          <div className="flex-1 min-h-0"><GestaoPage onOpenProject={onOpenProject} onOpenOrg={onOpenOrg} onOpenAdmin={() => setTab('plano')} /></div>
        )}
        {tab === 'mensagens' && (
          <div className="flex-1 min-h-0"><MensagensPage onOpenProject={onOpenProject} /></div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CRONOGRAMA EXECUTIVO — Gantt funcional
   ============================================================ */
/* ============================================================
   ROTAS TAB — Interactive map + filterable table
   ============================================================ */
function MapaCronogramaRotas({ visitas }: { visitas: VisitaRota[] }) {
  const { routes } = useStore();
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const normalizar = (nome: string) => chaveRotas(nome).replace(/[^a-z0-9]/g, '').replace('copasmig', 'coopasmig');
  const pontos = visitas.map((v, i): RotaItem => {
    const candidatos = routes.filter(r => normalizar(r.organizacao) === normalizar(v.organizacao));
    const base = candidatos.length === 1 ? candidatos[0] : undefined;
    return { id: i + 1, rota: v.rota, organizacao: v.organizacao, municipio: v.municipio, uf: v.uf,
      diasAtuacao: Number(v.valores[10]) || 0, modalAcesso: v.valores[11] ?? '', tipoComunidade: v.valores[12] ?? '', notasLogisticas: v.valores[13] ?? '',
      lat: base?.lat, lng: base?.lng, status: v.status === 'Realizada' ? 'Operacional' : 'Atenção' };
  });
  const semCoordenadas = pontos.filter(p => p.lat == null || p.lng == null);
  return <div className="rounded-xl border border-border bg-card p-4 space-y-3">
    <p className="text-sm text-muted-foreground">Rotas da planilha atual com coordenadas já cadastradas. As linhas ligam instituições e não representam o trajeto rodoviário ou fluvial.</p>
    {semCoordenadas.length > 0 && <p className="text-xs text-muted-foreground">Sem coordenadas conferidas: {semCoordenadas.map(p => p.organizacao).join(', ')}. As visitas continuam disponíveis no cronograma.</p>}
    <RotasMap routes={pontos} selectedId={selecionado} onSelect={setSelecionado} />
  </div>;
}

function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

/* Leaflet map with route grouping — loaded only on the client */
function RotasMap({ routes, selectedId, onSelect }: { routes: RotaItem[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let map: any = null;

    import('leaflet').then((LModule) => {
      const L = (LModule as any).default || LModule;
      if (!mounted || !containerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      map = L.map(containerRef.current, { center: [-3.5, -51], zoom: 5, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      leafletRef.current = L;
      setReady(true);
    });

    return () => {
      mounted = false;
      if (map) { map.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current, layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    // Group by rota name for polylines connecting stops
    const groups: Record<string, RotaItem[]> = {};
    routes.forEach(r => { if (r.lat != null && r.lng != null) (groups[r.rota] ??= []).push(r); });

    const palette = ['#344980', '#58805B', '#D3AD3E', '#B5473C', '#C47735', '#253253'];
    let idx = 0;
    const bounds: [number, number][] = [];

    Object.entries(groups).forEach(([rotaName, items]) => {
      const color = palette[idx++ % palette.length];
      const coords: [number, number][] = items.map(r => [r.lat!, r.lng!]);
      if (coords.length > 1) {
        L.polyline(coords, { color, weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(layer);
      }
      items.forEach(r => {
        bounds.push([r.lat!, r.lng!]);
        const st = statusColors[r.status ?? 'Operacional'];
        const tipoCor = colorForTipo(r.tipoComunidade);
        const isSel = r.id === selectedId;
        const marker = L.circleMarker([r.lat!, r.lng!], {
          radius: isSel ? 12 : 8,
          color: st,
          weight: isSel ? 4 : 3,
          fillColor: tipoCor,
          fillOpacity: 0.95,
        }).addTo(layer);
        marker.bindPopup(`
          <div style="font-family:var(--font-ui);max-width:100%;overflow-wrap:anywhere">
            <div style="font-weight:700;color:${color};font-size:12px">${esc(rotaName)}</div>
            <div style="font-weight:600;font-size:13px;margin-top:2px">${esc(r.organizacao)}</div>
            <div style="font-size:11px;color:var(--ink-4);margin-top:2px">${esc(r.municipio)}/${esc(r.uf)}</div>
            <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
              <span style="background:${tipoCor};color:var(--primary-foreground);padding:2px 6px;border-radius:4px;font-size:10px">${esc(r.tipoComunidade)}</span>
              <span style="background:${st};color:var(--primary-foreground);padding:2px 6px;border-radius:4px;font-size:10px">${r.status ?? 'Operacional'}</span>
            </div>
            <div style="font-size:11px;margin-top:6px"><b>Modal:</b> ${esc(r.modalAcesso)}</div>
            <div style="font-size:11px"><b>Dias:</b> ${r.diasAtuacao}</div>
            <div style="font-size:11px"><b>Coord.:</b> ${r.lat!.toFixed(4)}, ${r.lng!.toFixed(4)}</div>
            ${r.notasLogisticas ? `<div style="font-size:10.5px;color:var(--warning-strong-text);background:var(--warning-soft);padding:4px 6px;border-radius:4px;margin-top:6px">${esc(r.notasLogisticas)}</div>` : ''}
          </div>
        `);
        marker.on('click', () => onSelect(r.id));
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 8 });
    }
  }, [routes, selectedId, onSelect, ready]);

  return <div ref={containerRef} style={{ height: 460, width: '100%', zIndex: 0 }} />;
}

/* ============================================================
   CALENDÁRIO TAB — Google Calendar-like (month / week / day)
   ============================================================ */
type CalView = 'month' | 'week' | 'day';

function CalendarioTab() {
  const { events, addEvent, updateEvent, deleteEvent, routes, communities } = useStore();
  const { user } = useAuth();
  const { log } = useAudit();
  const record = (action: string, detail: string) =>
    log({ userLogin: user?.login ?? '—', area: 'calendário', action, detail, kind: 'alteracao' });
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
      <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-md" style={{ border: '1px solid var(--border)', background: 'var(--surface-0)' }}>Hoje</button>
          <button onClick={goPrev} className="p-1.5 rounded-md hover:bg-accent"><ChevronLeft size={16} /></button>
          <button onClick={goNext} className="p-1.5 rounded-md hover:bg-accent"><ChevronRight size={16} /></button>
          <div className="text-sm font-semibold ml-2 capitalize">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day', 'week', 'month'] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs px-3 py-1.5 capitalize"
                style={{ background: view === v ? 'var(--primary)' : 'var(--surface-0)', color: view === v ? 'var(--primary-foreground)' : 'var(--ink-1)', fontWeight: view === v ? 600 : 400 }}>
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
            if (editing != null) { updateEvent(editing, data); record('editar evento', `${data.title} · ${data.date}`); toast.success('Evento atualizado.'); }
            else { addEvent(data); record('criar evento', `${data.title} · ${data.date}`); toast.success('Evento criado.'); }
            setShowForm(false);
          }}
          onDelete={editing != null ? () => {
            const ev = events.find(x => x.id === editing);
            deleteEvent(editing);
            record('excluir evento', ev ? `${ev.title} · ${ev.date}` : String(editing));
            toast.success('Evento excluído.');
            setShowForm(false);
          } : undefined}
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
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
      <div className="grid grid-cols-7 border-b text-[11px] font-semibold text-muted-foreground" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        {weekDays.map(w => <div key={w} className="px-2 py-1.5 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[110px] border-b border-r" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }} />;
          const key = fmtDate(d);
          const list = events.filter(e => e.date === key);
          const isToday = isSameDay(d, today);
          return (
            <div key={i}
              onDoubleClick={() => onNew(key)}
              className="min-h-[110px] border-b border-r p-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}>
              <div className={`text-[11px] font-semibold mb-1 flex items-center justify-between ${isToday ? '' : 'text-foreground'}`}>
                <span style={isToday ? { background: 'var(--primary)', color: 'var(--primary-foreground)', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 } : {}}>{d.getDate()}</span>
                <button onClick={(ev) => { ev.stopPropagation(); onNew(key); }} className="text-muted-foreground hover:text-foreground"><Plus size={11} /></button>
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
    </div>
  );
}

/* ---- Week view ---- */
function WeekView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = new Date();
  return (
    <div className="overflow-x-auto">
    <div className="grid grid-cols-7 min-w-[700px]">
      {days.map(d => {
        const key = fmtDate(d);
        const list = events.filter(e => e.date === key).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
        const isToday = isSameDay(d, today);
        return (
          <div key={key} className="border-r min-h-[500px]" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center py-2 border-b" style={{ borderColor: 'var(--border)', background: isToday ? 'var(--brand-soft)' : 'var(--surface-1)' }}>
              <div className="text-[10px] uppercase text-muted-foreground">{weekDays[d.getDay()]}</div>
              <div className="text-lg font-bold" style={{ color: isToday ? 'var(--primary)' : undefined }}>{d.getDate()}</div>
            </div>
            <div className="p-2 space-y-1.5" onDoubleClick={() => onNew(key)}>
              {list.length === 0 && <div className="text-[10px] text-muted-foreground italic text-center pt-4">—</div>}
              {list.map(e => (
                <button key={e.id} onClick={() => onEdit(e.id)}
                  className="w-full text-left rounded p-1.5"
                  style={{ background: typeColors[e.type], color: 'var(--primary-foreground)' }}>
                  <div className="text-[10px] font-mono opacity-90">{e.startTime ?? 'todo o dia'}</div>
                  <div className="text-[11px] font-semibold leading-tight">{e.title}</div>
                  {e.responsavel && <div className="text-[10px] opacity-90 truncate">{e.responsavel}</div>}
                </button>
              ))}
              <LinkNovo onClick={() => onNew(key)} className="w-full justify-center py-1">Novo evento</LinkNovo>
            </div>
          </div>
        );
      })}
    </div>
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
            <div className="border-b p-1 min-h-[48px] hover:bg-accent cursor-pointer" style={{ borderColor: 'var(--border)' }}
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
      <div className="bg-card rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{initial ? 'Editar evento' : 'Novo evento'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          {onDelete ? <button onClick={onDelete} className="text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}><Trash2 size={12} />Excluir evento</button> : <span />}
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
