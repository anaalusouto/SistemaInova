/**
 * Importação da planilha de orçamento (RF-037, RN-030, RN-031).
 *
 * Dois passos, sempre: escolher arquivo e aba, ver a PRÉVIA, e só então
 * confirmar. A prévia mostra o que entraria, o que mudaria e — principalmente
 * — o que seria rejeitado e por quê. O documento é explícito em nunca concluir
 * importação parcial sem informar as linhas rejeitadas, e um contador
 * ("3 linhas ignoradas") não informa: a pessoa precisa saber quais linhas
 * abrir no Excel.
 *
 * Divergência não é corrigida aqui. Ou a equipe conserta o arquivo e reimporta,
 * ou registra a decisão de importar assim mesmo — e essa decisão fica gravada
 * junto com a importação.
 */
import { useRef, useState } from 'react';
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, X, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { lerPlanilha, aplicarImportacao, type PreviaImportacao } from '../../orcamentoImportacao.server';
import { moeda } from '../../lib/orcamento';

const LIMITE_MB = 10;

function Secao({ titulo, children, tom }: { titulo: string; children: React.ReactNode; tom?: 'alerta' | 'ok' }) {
  const cor = tom === 'alerta' ? 'var(--warning-strong-text)' : tom === 'ok' ? 'var(--success)' : 'var(--ink-5)';
  return (
    <div className="py-2" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: cor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {titulo}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--ink-2)', marginTop: 3, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

export function DialogoImportacao({
  projetoId, aoFechar,
}: { projetoId: number; aoFechar: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<{ nome: string; dataUrl: string } | null>(null);
  const [previa, setPrevia] = useState<PreviaImportacao | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoAusentes, setAcaoAusentes] = useState<'manter' | 'excluir'>('manter');
  const [decisao, setDecisao] = useState('');

  const carregar = async (f: File, aba?: string) => {
    if (f.size > LIMITE_MB * 1024 * 1024) {
      setErro(`O arquivo tem ${(f.size / 1048576).toFixed(1)} MB e o limite é ${LIMITE_MB} MB.`);
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result));
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.readAsDataURL(f);
      });
      setArquivo({ nome: f.name, dataUrl });
      const r = await lerPlanilha({ data: { projetoId, dataUrl, aba } });
      setPrevia(r);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler a planilha.');
      setPrevia(null);
    } finally {
      setOcupado(false);
    }
  };

  const trocarAba = async (aba: string) => {
    if (!arquivo) return;
    setOcupado(true);
    setErro(null);
    try {
      setPrevia(await lerPlanilha({ data: { projetoId, dataUrl: arquivo.dataUrl, aba } }));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler a aba.');
    } finally {
      setOcupado(false);
    }
  };

  const confirmar = async () => {
    if (!arquivo || !previa) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await aplicarImportacao({
        data: {
          projetoId,
          nomeArquivo: arquivo.nome,
          aba: previa.aba,
          dataUrl: arquivo.dataUrl,
          mapeamento: previa.mapeamento,
          linhaCabecalho: previa.linhaCabecalho,
          acaoAusentes,
          decisaoJustificada: decisao,
        },
      });
      toast.success(
        `Versão ${r.versao} importada: ${r.incluidos} incluído(s), ${r.alterados} alterado(s).`,
      );
      aoFechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir a importação.');
    } finally {
      setOcupado(false);
    }
  };

  const p = previa?.previa;
  const rec = previa?.reconciliacao;

  const temProblema = !!p && (
    p.rejeitadas.length > 0 || p.duplicadas.length > 0 || !!p.desacordoDeTotal ||
    p.itens.some(i => i.divergencias.length > 0) || (rec?.ambiguos.length ?? 0) > 0
  );
  const exigeDecisao = !!p && (p.duplicadas.length > 0 || (rec?.ambiguos.length ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.55)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border w-full max-w-3xl flex flex-col"
        style={{ borderColor: 'var(--border)', maxHeight: '92vh' }}
        role="dialog"
        aria-label="Importar planilha de orçamento"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
              Importar planilha de orçamento
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', marginTop: 2 }}>
              {previa ? `Versão ${previa.versaoAtual + 1} · confira a prévia antes de confirmar` : 'Selecione o arquivo .xlsx'}
            </div>
          </div>
          <button onClick={aoFechar} aria-label="Fechar importação"><X size={16} color="var(--ink-4)" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {erro && (
            <div
              className="flex items-start gap-2 rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--danger-soft-border)', background: 'var(--danger-soft)' }}
              role="alert"
            >
              <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--danger)', lineHeight: 1.5 }}>{erro}</span>
            </div>
          )}

          {!previa && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={ocupado}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-4)' }}
            >
              {ocupado ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
              <span style={{ fontSize: '0.82rem' }}>{ocupado ? 'Lendo a planilha…' : 'Escolher arquivo .xlsx'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>até {LIMITE_MB} MB</span>
            </button>
          )}

          {previa && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <FileSpreadsheet size={14} color="var(--ink-4)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{arquivo?.nome}</span>
                {previa.abas.length > 1 && (
                  <label className="inline-flex items-center gap-1.5">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>Aba:</span>
                    <select
                      className="border rounded-md px-2 py-1"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.75rem' }}
                      value={previa.aba}
                      onChange={e => trocarAba(e.target.value)}
                      disabled={ocupado}
                    >
                      {previa.abas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                )}
                <button
                  onClick={() => { setPrevia(null); setArquivo(null); setErro(null); }}
                  className="px-2 py-1 rounded-md border text-[11.5px]"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  trocar arquivo
                </button>
              </div>

              {previa.colunasNaoReconhecidas.length > 0 && (
                <div
                  className="flex items-start gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)' }}
                >
                  <AlertTriangle size={14} color="var(--warning-strong-text)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.76rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    Colunas não reconhecidas pelo cabeçalho: <strong>{previa.colunasNaoReconhecidas.join(', ')}</strong>.
                    Os itens serão importados sem esses campos — confira a amostra abaixo antes de confirmar.
                  </span>
                </div>
              )}

              {/* Amostra: deixa a pessoa ver se as colunas casam com o esperado. */}
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--line-1)' }}>
                <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <tbody>
                    {previa.amostra.map((linha, i) => (
                      <tr key={i} style={{ background: i === previa.linhaCabecalho ? 'var(--brand-soft)' : undefined }}>
                        <td className="px-1.5 py-1" style={{ color: 'var(--ink-5)', fontFamily: 'var(--font-mono)', borderRight: '1px solid var(--line-1)' }}>
                          {i + 1}
                        </td>
                        {linha.slice(0, 8).map((c, j) => (
                          <td key={j} className="px-1.5 py-1 truncate" style={{ maxWidth: 120, color: 'var(--ink-3)' }}>
                            {c === null || c === undefined ? '' : String(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Secao titulo="O que será importado" tom={p!.itens.length ? 'ok' : 'alerta'}>
                <strong>{p!.itens.length}</strong> {p!.itens.length === 1 ? 'item' : 'itens'} somando{' '}
                <strong>{moeda(p!.somaDosItens)}</strong>.{' '}
                {p!.controle.length > 0 && (
                  <>
                    {p!.controle.length} {p!.controle.length === 1 ? 'linha' : 'linhas'} de subtotal/total
                    identificadas como controle — não viram itens.{' '}
                  </>
                )}
                {p!.vazias > 0 && <>{p!.vazias} {p!.vazias === 1 ? 'linha vazia ignorada' : 'linhas vazias ignoradas'}.</>}
              </Secao>

              {rec && (
                <Secao titulo="Comparação com o que já está no projeto">
                  <span style={{ color: 'var(--success)' }}>{rec.incluidos.length} a incluir</span>
                  {' · '}
                  <span style={{ color: 'var(--warning-strong-text)' }}>{rec.alterados.length} a alterar</span>
                  {' · '}
                  <span style={{ color: 'var(--ink-4)' }}>{rec.inalterados} sem mudança</span>
                  {' · '}
                  <span style={{ color: rec.ausentes.length ? 'var(--danger)' : 'var(--ink-4)' }}>
                    {rec.ausentes.length} ausente(s) na nova versão
                  </span>

                  {rec.alterados.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {rec.alterados.slice(0, 6).map(a => (
                        <li key={a.existente.id} style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>
                          {a.existente.descricao}: {moeda(a.de)} <ArrowRight size={10} style={{ display: 'inline' }} /> {moeda(a.para)}
                          {a.existente.temExecucao && (
                            <span style={{ color: 'var(--info)' }}> · execução preservada</span>
                          )}
                        </li>
                      ))}
                      {rec.alterados.length > 6 && (
                        <li style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>…e mais {rec.alterados.length - 6}.</li>
                      )}
                    </ul>
                  )}

                  {rec.ausentes.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <span style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>
                        {rec.ausentes.map(a => a.descricao).slice(0, 4).join(', ')}
                        {rec.ausentes.length > 4 && ` e mais ${rec.ausentes.length - 4}`}.
                      </span>
                      {/* RN-031: item ausente não some sozinho. */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {([['manter', 'Manter no plano'], ['excluir', 'Marcar como excluídos']] as const).map(([v, r]) => (
                          <label key={v} className="inline-flex items-center gap-1.5" style={{ fontSize: '0.74rem', color: 'var(--ink-2)' }}>
                            <input type="radio" name="ausentes" checked={acaoAusentes === v} onChange={() => setAcaoAusentes(v)} />
                            {r}
                          </label>
                        ))}
                      </div>
                      {acaoAusentes === 'excluir' && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                          Itens com execução registrada não serão marcados — permanecem no plano.
                        </span>
                      )}
                    </div>
                  )}
                </Secao>
              )}

              {p!.rejeitadas.length > 0 && (
                <Secao titulo={`${p!.rejeitadas.length} linha(s) rejeitada(s)`} tom="alerta">
                  <ul className="flex flex-col gap-0.5">
                    {p!.rejeitadas.map(r => (
                      <li key={r.linhaPlanilha} style={{ fontSize: '0.74rem' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>linha {r.linhaPlanilha}</strong>: {r.motivo}
                      </li>
                    ))}
                  </ul>
                </Secao>
              )}

              {p!.itens.some(i => i.divergencias.length > 0) && (
                <Secao titulo="Divergências encontradas" tom="alerta">
                  <ul className="flex flex-col gap-0.5">
                    {p!.itens.filter(i => i.divergencias.length > 0).slice(0, 8).map(i => (
                      <li key={i.linhaPlanilha} style={{ fontSize: '0.74rem' }}>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>linha {i.linhaPlanilha}</strong>:{' '}
                        {i.divergencias.map(d => d.mensagem).join(' ')}
                      </li>
                    ))}
                  </ul>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginTop: 4 }}>
                    Nenhum número é corrigido automaticamente. Ajuste a planilha e reimporte, ou registre
                    a decisão abaixo.
                  </div>
                </Secao>
              )}

              {p!.desacordoDeTotal && (
                <Secao titulo="Total geral não bate com a soma dos itens" tom="alerta">
                  A planilha declara <strong>{moeda(p!.desacordoDeTotal.declarado)}</strong>, e a soma das
                  linhas de item dá <strong>{moeda(p!.desacordoDeTotal.somado)}</strong>.
                </Secao>
              )}

              {exigeDecisao && (
                <label className="flex flex-col gap-1">
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-3)' }}>
                    Decisão de importação <span style={{ color: 'var(--danger)' }}>*</span>
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                    Há correspondência ambígua ou linhas repetidas. Registre a decisão para prosseguir —
                    ela fica gravada junto com esta importação.
                  </span>
                  <textarea
                    className="w-full border rounded-lg px-2.5 py-1.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.78rem', resize: 'vertical' }}
                    rows={2}
                    value={decisao}
                    onChange={e => setDecisao(e.target.value)}
                  />
                </label>
              )}

              {!temProblema && (
                <div className="flex items-center gap-2" style={{ fontSize: '0.76rem', color: 'var(--success)' }}>
                  <CheckCircle2 size={14} /> Nenhuma divergência encontrada.
                </div>
              )}
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) void carregar(f);
              e.target.value = '';
            }}
          />
        </div>

        {previa && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button onClick={aoFechar} className="px-3 py-1.5 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={ocupado || p!.itens.length === 0 || (exigeDecisao && !decisao.trim())}
              className="px-4 py-1.5 rounded-md text-[12.5px] font-medium text-white"
              style={{
                background: 'var(--primary)',
                opacity: ocupado || p!.itens.length === 0 || (exigeDecisao && !decisao.trim()) ? 0.5 : 1,
              }}
            >
              {ocupado ? 'Importando…' : `Importar ${p!.itens.length} ${p!.itens.length === 1 ? 'item' : 'itens'}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
