/**
 * Campos de formulário do Plano de Trabalho.
 *
 * Pequenos de propósito: o que importa aqui é que rótulo, obrigatoriedade e
 * mensagem de erro apareçam sempre do mesmo jeito, em todos os formulários da
 * aba. Campo obrigatório é marcado no rótulo, não descoberto só ao salvar.
 */
import { type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

const baseInput: React.CSSProperties = {
  borderColor: 'var(--border)',
  background: 'var(--surface-1)',
  color: 'var(--ink-1)',
  fontSize: '0.8rem',
};

export function Campo({
  rotulo, obrigatorio, dica, children,
}: { rotulo: string; obrigatorio?: boolean; dica?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-3)' }}>
        {rotulo}
        {obrigatorio && <span style={{ color: 'var(--danger)' }} aria-hidden> *</span>}
        {obrigatorio && <span className="sr-only"> (obrigatório)</span>}
      </span>
      {children}
      {dica && <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{dica}</span>}
    </label>
  );
}

export function Texto({
  valor, aoMudar, placeholder, desabilitado,
}: { valor: string; aoMudar: (v: string) => void; placeholder?: string; desabilitado?: boolean }) {
  return (
    <input
      type="text"
      className="w-full border rounded-lg px-2.5 py-1.5"
      style={baseInput}
      value={valor}
      placeholder={placeholder}
      disabled={desabilitado}
      onChange={e => aoMudar(e.target.value)}
    />
  );
}

export function AreaTexto({
  valor, aoMudar, linhas = 3, placeholder, desabilitado,
}: { valor: string; aoMudar: (v: string) => void; linhas?: number; placeholder?: string; desabilitado?: boolean }) {
  return (
    <textarea
      className="w-full border rounded-lg px-2.5 py-1.5"
      style={{ ...baseInput, resize: 'vertical' }}
      rows={linhas}
      value={valor}
      placeholder={placeholder}
      disabled={desabilitado}
      onChange={e => aoMudar(e.target.value)}
    />
  );
}

/**
 * Data pura. `type="date"` fala 'AAAA-MM-DD' nativamente, que é exatamente o
 * formato das colunas DATE — sem conversão no meio, sem risco de fuso.
 */
export function Data({
  valor, aoMudar, min, max, desabilitado,
}: { valor: string | null; aoMudar: (v: string | null) => void; min?: string | null; max?: string | null; desabilitado?: boolean }) {
  return (
    <input
      type="date"
      className="w-full border rounded-lg px-2.5 py-1.5"
      style={baseInput}
      value={valor ?? ''}
      min={min ?? undefined}
      max={max ?? undefined}
      disabled={desabilitado}
      onChange={e => aoMudar(e.target.value || null)}
    />
  );
}

export function Selecao<T extends string>({
  valor, opcoes, aoMudar, desabilitado,
}: { valor: T; opcoes: readonly T[]; aoMudar: (v: T) => void; desabilitado?: boolean }) {
  return (
    <select
      className="w-full border rounded-lg px-2.5 py-1.5"
      style={baseInput}
      value={valor}
      disabled={desabilitado}
      onChange={e => aoMudar(e.target.value as T)}
    >
      {opcoes.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/** Lista de problemas que impedem o salvamento. */
export function Erros({ erros }: { erros: string[] }) {
  if (erros.length === 0) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: 'var(--danger-soft-border)', background: 'var(--danger-soft)' }}
      role="alert"
    >
      <AlertCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
      <ul style={{ fontSize: '0.75rem', color: 'var(--danger)', lineHeight: 1.5 }}>
        {erros.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

export function Acoes({
  aoCancelar, aoSalvar, salvando, rotuloSalvar = 'Salvar', children,
}: { aoCancelar: () => void; aoSalvar: () => void; salvando?: boolean; rotuloSalvar?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
      {children}
      <button
        type="button"
        onClick={aoCancelar}
        className="px-3 py-1.5 rounded-md border text-[12.5px]"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={aoSalvar}
        disabled={salvando}
        className="px-4 py-1.5 rounded-md text-[12.5px] font-medium text-white"
        style={{ background: 'var(--primary)', opacity: salvando ? 0.6 : 1 }}
      >
        {salvando ? 'Salvando…' : rotuloSalvar}
      </button>
    </div>
  );
}

/**
 * Confirmação de exclusão (RN-005).
 *
 * Diálogo próprio em vez de `confirm()` nativo: precisa dizer o que será
 * excluído e o que acontece com o histórico, e `confirm()` não permite isso.
 */
export function ConfirmarExclusao({
  titulo, descricao, aoCancelar, aoConfirmar,
}: { titulo: string; descricao: string; aoCancelar: () => void; aoConfirmar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.5)' }}
      onClick={aoCancelar}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-5 w-full max-w-md"
        style={{ borderColor: 'var(--border)' }}
        role="alertdialog"
        aria-label={titulo}
      >
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
          {titulo}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>{descricao}</p>
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={aoCancelar}
            className="px-3 py-1.5 rounded-md border text-[12.5px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            Cancelar
          </button>
          <button
            onClick={aoConfirmar}
            className="px-4 py-1.5 rounded-md text-[12.5px] font-medium text-white"
            style={{ background: 'var(--danger)' }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
