import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { CESTA_BLOCOS, type CestaCampo } from '../../diagnostic/catalog/cestaProdutos';
import {
  listarProdutos, criarProduto, salvarRespostasProduto, excluirProduto,
  type Produto, type ProdutoStatusPreenchimento,
} from '../../diagnosticos.server';
import { Chip } from './DiagnosticUI';

interface CestaProdutosTabProps {
  diagnosticoId: string;
  readOnly: boolean;
}

type Respostas = Record<string, string | string[] | number | null>;

const OUTRO_SUFFIX = '__outro';

function campoTemValor(v: string | string[] | number | null | undefined): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'number') return true;
  return v.trim() !== '';
}

function formatarValor(campo: CestaCampo, respostas: Respostas): string {
  const v = respostas[campo.id];
  if (!campoTemValor(v)) return '—';
  const outro = respostas[campo.id + OUTRO_SUFFIX];
  const base = Array.isArray(v) ? v.join(', ') : String(v);
  return outro ? `${base} (${outro})` : base;
}

export function CestaProdutosTab({ diagnosticoId, readOnly }: CestaProdutosTabProps) {
  const queryClient = useQueryClient();
  const [produtoAbertoId, setProdutoAbertoId] = useState<string | null>(null);
  const [showNovo, setShowNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaCadeia, setNovaCadeia] = useState('');

  const { data: produtos = [] } = useQuery({
    queryKey: ['diagnostico-produtos', diagnosticoId],
    queryFn: () => listarProdutos({ data: { diagnosticoId } }),
  });

  const criar = useMutation({
    mutationFn: () => criarProduto({ data: { diagnosticoId, nome: novoNome, cadeia: novaCadeia || null } }),
    onSuccess: produto => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-produtos', diagnosticoId] });
      setShowNovo(false); setNovoNome(''); setNovaCadeia('');
      setProdutoAbertoId(produto.id);
      toast.success('Produto adicionado.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível adicionar o produto.'),
  });

  const excluir = useMutation({
    mutationFn: (produtoId: string) => excluirProduto({ data: { produtoId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-produtos', diagnosticoId] });
      toast.success('Produto removido.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível remover.'),
  });

  const completos = produtos.filter(p => p.statusPreenchimento === 'completo').length;
  const emPreenchimento = produtos.length - completos;

  const produtoAberto = produtos.find(p => p.id === produtoAbertoId);
  if (produtoAberto) {
    return (
      <ProdutoEditor
        produto={produtoAberto}
        readOnly={readOnly}
        onBack={() => setProdutoAbertoId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-4)' }}>
          {produtos.length} produtos cadastrados · {completos} preenchidos · {emPreenchimento} em preenchimento
        </p>
        {!readOnly && (
          <button
            onClick={() => setShowNovo(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={13} /> Adicionar produto
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface-1)' }}>
              {['Produto', 'Cadeia', 'Preenchimento', 'Última edição', 'Ação'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                  {h}
                </th>
              ))}
              <th className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }} />
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3"><span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-1)' }}>{p.nome}</span></td>
                <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{p.cadeia || '—'}</span></td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      color: p.statusPreenchimento === 'completo' ? 'var(--success)' : 'var(--warning-strong-text)',
                      background: p.statusPreenchimento === 'completo' ? 'var(--success-soft)' : 'var(--warning-soft)',
                    }}
                  >
                    {p.statusPreenchimento === 'completo' ? 'Completo' : 'Em preenchimento'}
                  </span>
                </td>
                <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{new Date(p.atualizadoEm).toLocaleDateString('pt-BR')}</span></td>
                <td className="px-4 py-3">
                  <button onClick={() => setProdutoAbertoId(p.id)} className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                    {p.statusPreenchimento === 'completo' ? 'Visualizar' : 'Continuar'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {!readOnly && (
                    <button onClick={() => { if (window.confirm(`Excluir "${p.nome}"?`)) excluir.mutate(p.id); }} className="p-1 rounded hover:bg-red-50">
                      <Trash2 size={13} color="var(--danger)" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.5)' }} onClick={() => setShowNovo(false)}>
          <form
            onSubmit={e => { e.preventDefault(); if (novoNome.trim()) criar.mutate(); }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border p-6 w-full max-w-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-1)', marginBottom: 16 }}>
              Adicionar produto
            </h3>
            <label className="flex flex-col gap-1 mb-3">
              <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>Produto / Subproduto *</span>
              <input required value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Ex.: Açaí congelado" className="border rounded-lg px-3 py-2 text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }} />
            </label>
            <label className="flex flex-col gap-1 mb-4">
              <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>Cadeia produtiva</span>
              <input value={novaCadeia} onChange={e => setNovaCadeia(e.target.value)} placeholder="Ex.: Açaí" className="border rounded-lg px-3 py-2 text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }} />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowNovo(false)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
              <button type="submit" disabled={criar.isPending} className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>Adicionar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProdutoEditor({ produto, readOnly, onBack }: { produto: Produto; readOnly: boolean; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [respostas, setRespostas] = useState<Respostas>(produto.respostas);
  const [openBlocoId, setOpenBlocoId] = useState<string | null>(null);
  const [editingBlocoId, setEditingBlocoId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const salvar = useMutation({
    mutationFn: (status: ProdutoStatusPreenchimento) =>
      salvarRespostasProduto({ data: { produtoId: produto.id, nome: produto.nome, cadeia: produto.cadeia, respostas, statusPreenchimento: status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-produtos', produto.diagnosticoId] });
      setDirty(false);
      toast.success('Respostas salvas.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível salvar.'),
  });

  const setValor = (campoId: string, valor: string | string[] | number | null) => {
    setRespostas(r => ({ ...r, [campoId]: valor }));
    setDirty(true);
  };

  const blocoRespondido = (blocoId: string) => {
    const bloco = CESTA_BLOCOS.find(b => b.id === blocoId)!;
    return bloco.campos.some(c => campoTemValor(respostas[c.id]));
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <button onClick={onBack} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
        <ArrowLeft size={12} /> Cesta de Produtos
      </button>
      <div className="flex items-center justify-between">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-1)' }}>{produto.nome}</h3>
        {!readOnly && (
          <button
            onClick={() => salvar.mutate(produto.statusPreenchimento === 'completo' ? 'em_preenchimento' : 'completo')}
            disabled={salvar.isPending}
            className="px-3 py-1.5 rounded-md border text-[12px] font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            {produto.statusPreenchimento === 'completo' ? 'Marcar como em preenchimento' : 'Marcar como completo'}
          </button>
        )}
      </div>

      {CESTA_BLOCOS.map(bloco => {
        const open = openBlocoId === bloco.id;
        const editing = editingBlocoId === bloco.id;
        const respondido = blocoRespondido(bloco.id);

        return (
          <div key={bloco.id} className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => {
                if (open) { setOpenBlocoId(null); setEditingBlocoId(null); return; }
                setOpenBlocoId(bloco.id);
                setEditingBlocoId(!readOnly && !respondido ? bloco.id : null);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                {open ? <ChevronDown size={14} color="var(--ink-5)" /> : <ChevronRight size={14} color="var(--ink-5)" />}
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{bloco.id}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-1)' }}>{bloco.titulo}</span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                style={{ color: respondido ? 'var(--success)' : 'var(--ink-5)', background: respondido ? 'var(--success-soft)' : 'var(--surface-2)' }}
              >
                {respondido ? 'Preenchido' : 'Pendente'}
              </span>
            </button>

            {open && (
              <div className="px-4 pb-4 border-t flex flex-col gap-3 pt-3" style={{ borderColor: 'var(--border)' }}>
                {!editing ? (
                  <>
                    {respondido ? (
                      <div className="flex flex-col gap-2">
                        {bloco.campos.filter(c => campoTemValor(respostas[c.id])).map(c => (
                          <div key={c.id} className="flex gap-2">
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-4)', minWidth: 220 }}>{c.label}:</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{formatarValor(c, respostas)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-5)' }}>Nenhuma resposta registrada ainda neste bloco.</p>
                    )}
                    {!readOnly && (
                      <button onClick={() => setEditingBlocoId(bloco.id)} className="text-[12px] font-medium hover:underline w-fit" style={{ color: 'var(--primary)' }}>
                        Editar
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {bloco.campos.map(campo => (
                      <CampoEditor key={campo.id} campo={campo} respostas={respostas} onChange={setValor} />
                    ))}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => { salvar.mutate(produto.statusPreenchimento); setEditingBlocoId(null); }}
                        disabled={salvar.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Check size={13} /> Salvar bloco
                      </button>
                      {respondido && (
                        <button onClick={() => setEditingBlocoId(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
      {dirty && !readOnly && (
        <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>Lembre-se de salvar cada bloco alterado antes de sair.</p>
      )}
    </div>
  );
}

function CampoEditor({ campo, respostas, onChange }: { campo: CestaCampo; respostas: Respostas; onChange: (id: string, v: string | string[] | number | null) => void }) {
  const valor = respostas[campo.id];
  const outroValor = (respostas[campo.id + OUTRO_SUFFIX] as string) ?? '';
  const ehOutro = (v: string) => /^outr/i.test(v);
  const mostrarOutro =
    campo.permiteOutro && (campo.tipo === 'unica' ? typeof valor === 'string' && ehOutro(valor) : Array.isArray(valor) && (valor as string[]).some(ehOutro));

  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-1)' }}>{campo.label}</span>
      {campo.orientacao && <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{campo.orientacao}</span>}

      {campo.tipo === 'texto' && (
        <input
          value={(valor as string) ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
          placeholder={campo.placeholder}
          className="border rounded-lg px-3 py-2 text-[13px]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
        />
      )}

      {campo.tipo === 'numero' && (
        <input
          type="number"
          value={valor != null ? String(valor) : ''}
          onChange={e => onChange(campo.id, e.target.value === '' ? null : Number(e.target.value))}
          placeholder={campo.placeholder}
          className="border rounded-lg px-3 py-2 text-[13px] w-40"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
        />
      )}

      {campo.tipo === 'unica' && (
        <div className="flex flex-wrap gap-1.5">
          {campo.opcoes?.map(o => (
            <Chip key={o.valor} active={valor === o.valor} onClick={() => onChange(campo.id, valor === o.valor ? null : o.valor)}>
              {o.label}
            </Chip>
          ))}
        </div>
      )}

      {campo.tipo === 'multipla' && (
        <div className="flex flex-wrap gap-1.5">
          {campo.opcoes?.map(o => {
            const atual = Array.isArray(valor) ? valor : [];
            const active = atual.includes(o.valor);
            return (
              <Chip key={o.valor} active={active} onClick={() => onChange(campo.id, active ? atual.filter(v => v !== o.valor) : [...atual, o.valor])}>
                {o.label}
              </Chip>
            );
          })}
        </div>
      )}

      {mostrarOutro && (
        <input
          value={outroValor}
          onChange={e => onChange(campo.id + OUTRO_SUFFIX, e.target.value)}
          placeholder="Especifique..."
          className="border rounded-lg px-3 py-2 text-[13px] max-w-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
        />
      )}
    </div>
  );
}
