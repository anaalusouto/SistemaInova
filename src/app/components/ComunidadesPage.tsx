import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, ChevronRight, Search, Users, MapPin, Plus, Trash2, ExternalLink, Save } from 'lucide-react';
import { useStore } from '../store';
import type { Comunidade } from '../data/comunidades';
import type { Project } from '../data/mockData';

interface Props { onOpenProject?: (p: Project) => void; }

export function ComunidadesPage({ onOpenProject }: Props) {
  const { communities, projects } = useStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(() =>
    communities.filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.localizacao.toLowerCase().includes(search.toLowerCase())),
    [communities, search]);

  if (selected != null) {
    const c = communities.find(x => x.id === selected);
    if (c) return <ComunidadeDetail comunidade={c} onBack={() => setSelected(null)} onOpenProject={onOpenProject} projects={projects} />;
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="mb-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem' }}>Comunidades</h1>
            <p className="text-sm text-muted-foreground">INOVA FAS/FUNBIO — {communities.length} comunidades vinculadas</p>
          </div>
        </div>

        <div className="relative mb-5">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou localidade..."
            className="w-full pl-9 pr-3 py-2 rounded-md text-sm"
            style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }} />
        </div>

        <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c.id)}
              className="rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#475569' }}>{c.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>{c.status}</span>
                    <span className="text-xs text-muted-foreground">{c.segmentoSocial}</span>
                  </div>
                  <h3 className="mb-1 font-semibold">{c.nome}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={11} />{c.localizacao}</span>
                    <span>{c.eixoPrincipal}</span>
                    <span>{c.financiador}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Valor total</div>
                  <div className="text-sm font-semibold">R$ {c.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground self-center" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Detail ----------

function ComunidadeDetail({ comunidade, onBack, onOpenProject, projects }: {
  comunidade: Comunidade; onBack: () => void; onOpenProject?: (p: Project) => void; projects: Project[];
}) {
  const { updateCommunity } = useStore();
  const [c, setC] = useState<Comunidade>(comunidade);
  const linkedProject = projects.find(p => p.id === c.projectId);

  const save = () => { updateCommunity(c.id, c); toast.success('Comunidade salva.'); };

  const setField = <K extends keyof Comunidade>(k: K, v: Comunidade[K]) => setC(prev => ({ ...prev, [k]: v }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 border-b" style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-2 hover:text-foreground">
            <ArrowLeft size={14} /> Comunidades
          </button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: '#F1F5F9' }}>{c.code}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>{c.status}</span>
              </div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>{c.nome}</h1>
              <div className="text-xs text-muted-foreground mt-1">{c.localizacao} · {c.segmentoSocial} · {c.eixoPrincipal}</div>
            </div>
            <div className="flex gap-2">
              {linkedProject && onOpenProject && (
                <button onClick={() => onOpenProject(linkedProject)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md"
                  style={{ border: '1px solid var(--border)' }}>
                  <ExternalLink size={13} /> Abrir projeto vinculado
                </button>
              )}
              <button onClick={save}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-md"
                style={{ background: 'var(--primary)' }}>
                <Save size={13} /> Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-4">
        <Accordion title="Dados Base" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome"><input className="ci" value={c.nome} onChange={e => setField('nome', e.target.value)} /></Field>
            <Field label="Responsável Técnico (CRIA)"><input className="ci" value={c.responsavelTecnico} onChange={e => setField('responsavelTecnico', e.target.value)} /></Field>
            <Field label="Segmento Social"><input className="ci" value={c.segmentoSocial} onChange={e => setField('segmentoSocial', e.target.value)} /></Field>
            <Field label="Eixo Principal"><input className="ci" value={c.eixoPrincipal} onChange={e => setField('eixoPrincipal', e.target.value)} /></Field>
            <Field label="Classificação"><input className="ci" value={c.classificacao} onChange={e => setField('classificacao', e.target.value)} /></Field>
            <Field label="Localização"><input className="ci" value={c.localizacao} onChange={e => setField('localizacao', e.target.value)} /></Field>
            <Field label="Município"><input className="ci" value={c.municipio ?? ''} onChange={e => setField('municipio', e.target.value)} /></Field>
            <Field label="UF"><input className="ci" value={c.uf ?? ''} onChange={e => setField('uf', e.target.value)} /></Field>
            <Field label="Financiador"><input className="ci" value={c.financiador} onChange={e => setField('financiador', e.target.value)} /></Field>
            <Field label="Valor Total (R$)"><input type="number" className="ci" value={c.valorTotal} onChange={e => setField('valorTotal', Number(e.target.value))} /></Field>
            <Field label="Início Previsto"><input className="ci" value={c.inicioPrevisto} onChange={e => setField('inicioPrevisto', e.target.value)} placeholder="MM/AAAA" /></Field>
            <Field label="Final Previsto"><input className="ci" value={c.finalPrevisto} onChange={e => setField('finalPrevisto', e.target.value)} placeholder="MM/AAAA" /></Field>
            <Field label="Objetivo" full><textarea className="ci h-[80px]" value={c.objetivo} onChange={e => setField('objetivo', e.target.value)} /></Field>
            <Field label="Projeto vinculado (INOVA)">
              <select className="ci" value={c.projectId ?? ''} onChange={e => setField('projectId', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Sem vínculo —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
              </select>
            </Field>
          </div>
        </Accordion>

        <Accordion title="Pessoas" icon={<Users size={14} />}>
          <ListEditor
            items={c.pessoas}
            onChange={list => setField('pessoas', list)}
            fields={[
              { key: 'nome', label: 'Nome', width: '30%' },
              { key: 'funcao', label: 'Função', width: '30%' },
              { key: 'contato', label: 'Contato', width: '40%' },
            ]}
            makeNew={() => ({ nome: '', funcao: '', contato: '' })}
          />
        </Accordion>

        <TextAccordion title="Infraestrutura" value={c.infraestrutura} onChange={v => setField('infraestrutura', v)} />
        <TextAccordion title="Certificação" value={c.certificacao} onChange={v => setField('certificacao', v)} />

        <Accordion title="Fornecedores / Compradores">
          <ListEditor
            items={c.fornecedores}
            onChange={list => setField('fornecedores', list)}
            fields={[
              { key: 'nome', label: 'Nome', width: '40%' },
              { key: 'papel', label: 'Papel', width: '25%', type: 'select', options: ['Fornecedor', 'Comprador'] },
              { key: 'detalhe', label: 'Detalhe', width: '35%' },
            ]}
            makeNew={() => ({ nome: '', papel: 'Fornecedor' as const, detalhe: '' })}
          />
        </Accordion>

        <Accordion title="Capacitação">
          <ListEditor
            items={c.capacitacoes}
            onChange={list => setField('capacitacoes', list)}
            fields={[
              { key: 'tema', label: 'Tema', width: '40%' },
              { key: 'publico', label: 'Público', width: '30%' },
              { key: 'status', label: 'Status', width: '30%', type: 'select', options: ['Prevista', 'Em curso', 'Concluída'] },
            ]}
            makeNew={() => ({ tema: '', publico: '', status: 'Prevista' as const })}
          />
        </Accordion>

        <TextAccordion title="Território" value={c.territorio} onChange={v => setField('territorio', v)} />

        <Accordion title="Produtos">
          <ListEditor
            items={c.produtos}
            onChange={list => setField('produtos', list)}
            fields={[
              { key: 'nome', label: 'Nome', width: '35%' },
              { key: 'categoria', label: 'Categoria', width: '30%' },
              { key: 'observacao', label: 'Observação', width: '35%' },
            ]}
            makeNew={() => ({ nome: '', categoria: '', observacao: '' })}
          />
        </Accordion>

        <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:#F8FAFC;color:#0F172A}
        .ci:focus{border-color:var(--primary);background:#fff}
        .ci textarea{resize:none}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </label>
  );
}

function Accordion({ title, children, defaultOpen, icon }: { title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-5 py-3 text-left" style={{ background: '#F8FAFC' }}>
        {icon}
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>{title}</span>
        {open ? <ChevronDown size={14} className="ml-auto" /> : <ChevronRight size={14} className="ml-auto" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function TextAccordion({ title, value, onChange }: { title: string; value: string; onChange: (v: string) => void }) {
  return (
    <Accordion title={title}>
      <textarea className="ci" style={{ minHeight: 100, width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#F8FAFC' }}
        value={value} onChange={e => onChange(e.target.value)} placeholder={`Descrição de ${title.toLowerCase()}...`} />
    </Accordion>
  );
}

interface ListField { key: string; label: string; width?: string; type?: 'text' | 'select'; options?: string[]; }
function ListEditor<T extends { id: number }>({ items, onChange, fields, makeNew }: {
  items: T[]; onChange: (l: T[]) => void; fields: ListField[]; makeNew: () => Omit<T, 'id'>;
}) {
  const add = () => {
    const nextId = items.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    onChange([...items, { ...(makeNew() as object), id: nextId } as T]);
  };
  const remove = (id: number) => onChange(items.filter(i => i.id !== id));
  const update = (id: number, key: string, v: string) => onChange(items.map(i => i.id === id ? { ...i, [key]: v } : i));

  return (
    <div>
      {items.length === 0 && <p className="text-xs text-muted-foreground mb-3">Nenhum item cadastrado.</p>}
      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map(i => (
            <div key={i.id} className="flex gap-2 items-center">
              {fields.map(f => (
                <div key={f.key} style={{ width: f.width ?? 'auto', flex: f.width ? undefined : 1 }}>
                  {f.type === 'select' ? (
                    <select className="w-full text-sm px-2 py-1.5 rounded" style={{ border: '1px solid var(--border)', background: '#fff' }}
                      value={String((i as unknown as Record<string, string>)[f.key] ?? '')} onChange={e => update(i.id, f.key, e.target.value)}>
                      {f.options?.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="w-full text-sm px-2 py-1.5 rounded" style={{ border: '1px solid var(--border)', background: '#fff' }}
                      value={String((i as unknown as Record<string, string>)[f.key] ?? '')} onChange={e => update(i.id, f.key, e.target.value)}
                      placeholder={f.label} />
                  )}
                </div>
              ))}
              <button onClick={() => remove(i.id)} className="p-1.5 rounded hover:bg-red-50">
                <Trash2 size={13} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={add} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md" style={{ border: '1px solid var(--border)', color: '#475569' }}>
        <Plus size={12} /> Adicionar
      </button>
    </div>
  );
}
