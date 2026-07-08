import { useRef, useState } from 'react';
import { FileText, Image, Video, Link2, File, Upload, Search, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Evidence } from '../../data/mockData';
import { useStore } from '../../store';

const typeConfig = {
  PDF:       { icon: FileText, color: '#DC2626', bg: '#FEF2F2' },
  Imagem:    { icon: Image,    color: '#7C3AED', bg: '#F5F3FF' },
  Vídeo:     { icon: Video,    color: '#D97706', bg: '#FFFBEB' },
  Link:      { icon: Link2,    color: '#2563EB', bg: '#EFF6FF' },
  Documento: { icon: File,     color: '#059669', bg: '#ECFDF5' },
} as const;

type FilterType = 'Todos' | Evidence['type'];

interface Props { project: Project; }

function detectType(name: string): Evidence['type'] {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'PDF';
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(n)) return 'Imagem';
  if (/\.(mp4|mov|webm|avi)$/.test(n)) return 'Vídeo';
  if (/^https?:\/\//.test(n)) return 'Link';
  return 'Documento';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function TabEvidencias({ project }: Props) {
  const { addEvidence, deleteEvidence } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterType>('Todos');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = project.evidences.filter(e => {
    const matchQ = !q || e.name.toLowerCase().includes(q.toLowerCase());
    const matchT = filter === 'Todos' || e.type === filter;
    return matchQ && matchT;
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      addEvidence(project.id, {
        name: file.name,
        type: detectType(file.name),
        relatedActivity: '—',
        uploadDate: new Date().toLocaleDateString('pt-BR'),
        size: formatSize(file.size),
      });
    });
    toast.success(`${files.length} arquivo(s) adicionado(s).`);
  };

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>Evidências</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{project.evidences.length} arquivos vinculados</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
            <Search size={13} color="#94A3B8" />
            <input className="outline-none text-[12px] bg-transparent w-32" placeholder="Buscar arquivo..." value={q} onChange={e => setQ(e.target.value)} style={{ color: '#0F172A' }} />
          </div>
          <button
            onClick={() => setShowLinkForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: '#475569', background: '#fff' }}
          >
            <Link2 size={12} /> Link
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Upload size={12} /> Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['Todos', 'PDF', 'Imagem', 'Vídeo', 'Link', 'Documento'] as FilterType[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1 rounded-md border text-[12px] transition-all"
            style={{
              borderColor: filter === t ? 'var(--primary)' : 'var(--border)',
              background: filter === t ? '#EFF6FF' : '#fff',
              color: filter === t ? '#2563EB' : '#64748B',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed py-16 cursor-pointer hover:border-blue-300 transition-colors"
          style={{ borderColor: '#CBD5E1' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
            <Upload size={24} color="#2563EB" />
          </div>
          <div className="text-center">
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>Solte arquivos aqui</p>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>PDF, imagens, vídeos, links e documentos</p>
            <button
              type="button"
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white mx-auto"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={14} /> Adicionar evidência
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(ev => {
              const cfg = typeConfig[ev.type] ?? typeConfig['Documento'];
              const Icon = cfg.icon;
              return (
                <div key={ev.id} className="bg-card rounded-xl border p-4 flex flex-col gap-3 group" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon size={18} color={cfg.color} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: cfg.bg, color: cfg.color }}>{ev.type}</span>
                      <button
                        onClick={() => { if (window.confirm('Excluir evidência?')) { deleteEvidence(project.id, ev.id); toast.success('Excluída.'); } }}
                        className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#0F172A', lineHeight: 1.4 }} title={ev.name}>
                      {ev.name.length > 40 ? ev.name.slice(0, 40) + '…' : ev.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 3 }}>{ev.relatedActivity}</div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{ev.uploadDate}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{ev.size}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer hover:border-blue-300 transition-colors mt-1"
            style={{ borderColor: '#CBD5E1' }}
          >
            <Upload size={16} color="#94A3B8" />
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
              Arraste arquivos ou <span style={{ color: 'var(--primary)' }}>clique para adicionar</span>
            </span>
          </div>
        </div>
      )}

      {showLinkForm && (
        <LinkForm
          onClose={() => setShowLinkForm(false)}
          onSave={(url, title) => {
            addEvidence(project.id, {
              name: title || url,
              type: 'Link',
              relatedActivity: '—',
              uploadDate: new Date().toLocaleDateString('pt-BR'),
              size: '—',
            });
            toast.success('Link vinculado.');
            setShowLinkForm(false);
          }}
        />
      )}
    </div>
  );
}

function LinkForm({ onClose, onSave }: { onClose: () => void; onSave: (url: string, title: string) => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form
        onSubmit={e => { e.preventDefault(); if (!url) { toast.error('Informe o URL.'); return; } onSave(url, title); }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl border p-6 w-full max-w-md"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Vincular Link</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="text-[11px] font-medium" style={{ color: '#64748B' }}>URL *</label>
          <input value={url} onChange={e => setUrl(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border)' }} placeholder="https://..." />
          <label className="text-[11px] font-medium" style={{ color: '#64748B' }}>Título (opcional)</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: 'var(--border)' }} />
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
          <button type="submit" className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Vincular</button>
        </div>
      </form>
    </div>
  );
}
