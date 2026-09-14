import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Paperclip, Plus, Trash2 } from 'lucide-react';
import { PARECER_GRUPOS, type ParecerCampo } from '../../diagnostic/catalog/parecerComplementar';
import { CHECKLIST_DOCUMENTAL } from '../../diagnostic/catalog/checklistDocumental';
import { IEO_DIMENSOES } from '../../diagnostic/catalog/ieo';
import { MATRIZ_FUNCOES } from '../../diagnostic/catalog/matrizFuncional';
import { calcularIeo } from '../../diagnostic/ieoCalculation';
import {
  getParecer, salvarParecer, listarChecklist, salvarChecklistItem, uploadAnexoChecklist, getAnexo,
  listarRespostasMatriz, listarRespostasIeo, listarProdutos, type EvidenciaVinculada,
} from '../../diagnosticos.server';
import { useAuth } from '../../auth/authStore';
import { Chip } from './DiagnosticUI';

interface ParecerTecnicoTabProps {
  diagnosticoId: string;
  readOnly: boolean;
}

type RespostasComplementares = Record<string, string | string[] | null>;
const OUTRO_SUFFIX = '__outro';

function temValor(v: string | string[] | null | undefined): boolean {
  if (v == null) return false;
  return Array.isArray(v) ? v.length > 0 : v.trim() !== '';
}

export function ParecerTecnicoTab({ diagnosticoId, readOnly }: ParecerTecnicoTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // --- Resumo de apoio (Matriz / IEO / Cesta), somente leitura --------------
  const { data: matrizRespostas = [] } = useQuery({ queryKey: ['diagnostico-matriz', diagnosticoId], queryFn: () => listarRespostasMatriz({ data: { diagnosticoId } }) });
  const { data: ieoRespostas = [] } = useQuery({ queryKey: ['diagnostico-ieo', diagnosticoId], queryFn: () => listarRespostasIeo({ data: { diagnosticoId } }) });
  const { data: produtos = [] } = useQuery({ queryKey: ['diagnostico-produtos', diagnosticoId], queryFn: () => listarProdutos({ data: { diagnosticoId } }) });
  const ieoResultado = useMemo(() => calcularIeo(ieoRespostas.map(r => ({ perguntaId: r.perguntaId, nivel: r.nivel }))), [ieoRespostas]);

  // --- Parecer (Parte 1 + Parte 2 + evidências) ------------------------------
  const { data: parecer } = useQuery({ queryKey: ['diagnostico-parecer', diagnosticoId], queryFn: () => getParecer({ data: { diagnosticoId } }) });
  const [respostas, setRespostas] = useState<RespostasComplementares>({});
  const [analise, setAnalise] = useState({ sintese: '', capacidades: '', fragilidades: '', pontosPrioritarios: '', consideracoesTecnicas: '' });
  const [evidencias, setEvidencias] = useState<EvidenciaVinculada[]>([]);
  const [novaEvidencia, setNovaEvidencia] = useState<EvidenciaVinculada>({ tipo: '', referencia: '', nota: '' });
  const hydrated = useRef(false);

  useEffect(() => {
    if (!parecer || hydrated.current) return;
    hydrated.current = true;
    setRespostas(parecer.respostasComplementares);
    setAnalise({
      sintese: parecer.sintese ?? '', capacidades: parecer.capacidades ?? '', fragilidades: parecer.fragilidades ?? '',
      pontosPrioritarios: parecer.pontosPrioritarios ?? '', consideracoesTecnicas: parecer.consideracoesTecnicas ?? '',
    });
    setEvidencias(parecer.evidenciasVinculadas);
  }, [parecer]);

  const salvarMutation = useMutation({
    mutationFn: () => salvarParecer({
      data: {
        diagnosticoId, respostasComplementares: respostas, sintese: analise.sintese || null,
        capacidades: analise.capacidades || null, fragilidades: analise.fragilidades || null,
        pontosPrioritarios: analise.pontosPrioritarios || null, consideracoesTecnicas: analise.consideracoesTecnicas || null,
        evidenciasVinculadas: evidencias,
      },
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diagnostico-parecer', diagnosticoId] }); toast.success('Parecer salvo.'); },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível salvar.'),
  });

  const setResposta = (campoId: string, valor: string | string[] | null) => setRespostas(r => ({ ...r, [campoId]: valor }));

  // --- Checklist documental + anexos -----------------------------------------
  const { data: checklist = [] } = useQuery({ queryKey: ['diagnostico-checklist', diagnosticoId], queryFn: () => listarChecklist({ data: { diagnosticoId } }) });
  const checklistMap = useMemo(() => new Map(checklist.map(c => [c.itemId, c])), [checklist]);

  const salvarChecklist = useMutation({
    mutationFn: (payload: { itemId: number; disponivel: 'Sim' | 'Não' | 'N/A' | null; observacoes: string | null }) =>
      salvarChecklistItem({ data: { diagnosticoId, ...payload } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diagnostico-checklist', diagnosticoId] }),
    onError: (e: Error) => toast.error(e.message || 'Não foi possível salvar.'),
  });

  const upload = useMutation({
    mutationFn: (payload: { itemId: number; nomeArquivo: string; tipoMime: string; conteudoBase64: string }) =>
      uploadAnexoChecklist({ data: { diagnosticoId, enviadoPor: user?.login ?? '—', ...payload } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['diagnostico-checklist', diagnosticoId] }); toast.success('Anexo enviado.'); },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível enviar o anexo.'),
  });

  const abrirAnexo = async (anexoId: string) => {
    try {
      const { url } = await getAnexo({ data: { anexoId } });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o anexo.');
    }
  };

  const handleFile = (itemId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      upload.mutate({ itemId, nomeArquivo: file.name, tipoMime: file.type, conteudoBase64: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Resumo de apoio */}
      <div className="bg-card rounded-xl border p-4 grid grid-cols-3 gap-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', textTransform: 'uppercase' }}>Matriz Funcional</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-1)' }}>{matrizRespostas.length} de {MATRIZ_FUNCOES.length} funções preenchidas</p>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', textTransform: 'uppercase' }}>IEO</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-1)' }}>
            Geral {ieoResultado.geral?.toFixed(1) ?? '—'} · {ieoRespostas.length}/{IEO_DIMENSOES.flatMap(d => d.subdimensoes.flatMap(s => s.perguntas)).length} perguntas
          </p>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', textTransform: 'uppercase' }}>Cesta de Produtos</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-1)' }}>{produtos.length} produto(s) · {produtos.filter(p => p.statusPreenchimento === 'completo').length} completo(s)</p>
        </div>
      </div>

      {/* Parte 1 */}
      <div className="flex flex-col gap-5">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
          Parte 1 — Informações complementares
        </h3>
        {PARECER_GRUPOS.map(grupo => (
          <div key={grupo.id} className="bg-card rounded-xl border p-4 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-1)' }}>{grupo.titulo}</h4>
            {grupo.campos.map(campo => (
              <ParecerCampoField key={campo.id} campo={campo} respostas={respostas} onChange={setResposta} readOnly={readOnly} />
            ))}
          </div>
        ))}
      </div>

      {/* Checklist documental */}
      <div className="flex flex-col gap-3">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
          Checklist documental
        </h3>
        <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Documento', 'Disponível?', 'Observações / evidência', 'Anexo'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHECKLIST_DOCUMENTAL.map(item => {
                const resp = checklistMap.get(item.id);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3" style={{ fontSize: '0.8rem', color: 'var(--ink-1)', maxWidth: 220 }}>{item.documento}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(['Sim', 'Não', 'N/A'] as const).map(v => (
                          <Chip
                            key={v}
                            active={resp?.disponivel === v}
                            onClick={() => !readOnly && salvarChecklist.mutate({ itemId: item.id, disponivel: resp?.disponivel === v ? null : v, observacoes: resp?.observacoes ?? null })}
                          >
                            {v}
                          </Chip>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        defaultValue={resp?.observacoes ?? ''}
                        disabled={readOnly}
                        onBlur={e => salvarChecklist.mutate({ itemId: item.id, disponivel: resp?.disponivel ?? null, observacoes: e.target.value || null })}
                        placeholder="Observações / evidência"
                        className="border rounded-lg px-2 py-1.5 text-[12px] w-full"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {resp?.anexoId ? (
                        <button onClick={() => abrirAnexo(resp.anexoId!)} className="flex items-center gap-1 text-[12px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                          <Paperclip size={12} /> Ver anexo
                        </button>
                      ) : !readOnly ? (
                        <label className="flex items-center gap-1 text-[12px] font-medium cursor-pointer hover:underline" style={{ color: 'var(--primary)' }}>
                          <Paperclip size={12} /> Adicionar anexo
                          <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(item.id, f); }} />
                        </label>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parte 2 */}
      <div className="flex flex-col gap-3">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
          Parte 2 — Análise Técnica
        </h3>
        {([
          ['sintese', 'Síntese da situação da organização'],
          ['capacidades', 'Principais capacidades identificadas'],
          ['fragilidades', 'Principais fragilidades e lacunas'],
          ['pontosPrioritarios', 'Pontos prioritários para fortalecimento'],
          ['consideracoesTecnicas', 'Considerações técnicas'],
        ] as const).map(([campo, label]) => (
          <label key={campo} className="flex flex-col gap-1">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
            {readOnly ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{analise[campo] || '—'}</p>
            ) : (
              <textarea
                value={analise[campo]}
                onChange={e => setAnalise(a => ({ ...a, [campo]: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-[13px] min-h-[80px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
              />
            )}
          </label>
        ))}
      </div>

      {/* Evidências vinculadas */}
      <div className="flex flex-col gap-3">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
          Evidências vinculadas <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--ink-5)' }}>(opcional)</span>
        </h3>
        <div className="flex flex-col gap-2">
          {evidencias.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 bg-card rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-3)' }}>{ev.tipo}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{ev.referencia}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)', flex: 1 }}>{ev.nota}</span>
              {!readOnly && (
                <button onClick={() => setEvidencias(list => list.filter((_, idx) => idx !== i))} className="p-1 rounded hover:bg-red-50">
                  <Trash2 size={12} color="var(--danger)" />
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <select value={novaEvidencia.tipo} onChange={e => setNovaEvidencia(v => ({ ...v, tipo: e.target.value }))} className="border rounded-lg px-2 py-1.5 text-[12px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}>
              <option value="">Tipo...</option>
              <option value="Matriz Funcional">Matriz Funcional</option>
              <option value="IEO">IEO</option>
              <option value="Cesta de Produtos">Cesta de Produtos</option>
              <option value="Documento">Documento</option>
              <option value="Observação de campo">Observação de campo</option>
            </select>
            <input value={novaEvidencia.referencia} onChange={e => setNovaEvidencia(v => ({ ...v, referencia: e.target.value }))} placeholder="Referência" className="border rounded-lg px-2 py-1.5 text-[12px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }} />
            <input value={novaEvidencia.nota} onChange={e => setNovaEvidencia(v => ({ ...v, nota: e.target.value }))} placeholder="Nota" className="border rounded-lg px-2 py-1.5 text-[12px] flex-1" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }} />
            <button
              onClick={() => {
                if (!novaEvidencia.tipo || !novaEvidencia.referencia) return;
                setEvidencias(list => [...list, novaEvidencia]);
                setNovaEvidencia({ tipo: '', referencia: '', nota: '' });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-[12px]"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
            >
              <Plus size={12} /> Vincular
            </button>
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          onClick={() => salvarMutation.mutate()}
          disabled={salvarMutation.isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60 w-fit"
          style={{ background: 'var(--primary)' }}
        >
          <Check size={14} /> Salvar Parecer
        </button>
      )}
    </div>
  );
}

function ParecerCampoField({
  campo, respostas, onChange, readOnly,
}: { campo: ParecerCampo; respostas: RespostasComplementares; onChange: (id: string, v: string | string[] | null) => void; readOnly: boolean }) {
  const valor = respostas[campo.id];
  const outroValor = (respostas[campo.id + OUTRO_SUFFIX] as string) ?? '';
  const ehOutro = (v: string) => /^outr/i.test(v);
  const mostrarOutro = campo.permiteOutro && (campo.tipo === 'unica' ? typeof valor === 'string' && ehOutro(valor) : Array.isArray(valor) && valor.some(ehOutro));

  if (readOnly) {
    return (
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-3)' }}>{campo.label}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
          {temValor(valor) ? (Array.isArray(valor) ? valor.join(', ') : valor) + (outroValor ? ` (${outroValor})` : '') : '—'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-1)' }}>{campo.label}</span>
      {campo.tipo === 'texto' && (
        <textarea
          value={(valor as string) ?? ''}
          onChange={e => onChange(campo.id, e.target.value)}
          className="border rounded-lg px-3 py-2 text-[13px] min-h-[50px]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
        />
      )}
      {(campo.tipo === 'unica' || campo.tipo === 'multipla') && (
        <div className="flex flex-wrap gap-1.5">
          {campo.opcoes?.map(o => {
            const active = campo.tipo === 'unica' ? valor === o.valor : Array.isArray(valor) && valor.includes(o.valor);
            const toggle = () => {
              if (campo.tipo === 'unica') { onChange(campo.id, active ? null : o.valor); return; }
              const atual = Array.isArray(valor) ? valor : [];
              onChange(campo.id, active ? atual.filter(v => v !== o.valor) : [...atual, o.valor]);
            };
            return <Chip key={o.valor} active={active} onClick={toggle}>{o.label}</Chip>;
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
