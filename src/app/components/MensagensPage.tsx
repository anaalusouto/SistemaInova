import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Hash, CheckSquare } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useStore } from '../store';
import { useMensagens } from '../mensagens/useMensagens';
import { buildMentionOptions, searchMentionOptions, mentionToken, getMentionQuery, renderMessageText, type MentionOption } from '../mensagens/mentionUtils';

function formatMsgTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
}

export function MensagensPage({ onOpenProject }: { onOpenProject: (projectId: number) => void }) {
  const { user } = useAuth();
  const { projects } = useStore();
  const { mensagens, loading, send } = useMensagens();
  const options = useMemo(() => buildMentionOptions(projects), [projects]);

  const [text, setText] = useState('');
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [mensagens.length]);

  const matches = mention ? searchMentionOptions(options, mention.query) : [];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    const cursor = e.target.selectionStart ?? value.length;
    setMention(getMentionQuery(value, cursor));
  };

  const insertMention = (opt: MentionOption) => {
    if (!mention || !textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart ?? text.length;
    const token = `${mentionToken(opt)} `;
    const next = text.slice(0, mention.start) + token + text.slice(cursor);
    setText(next);
    setMention(null);
    const pos = mention.start + token.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  };

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await send(value);
      setText('');
      setMention(null);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && matches.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      insertMention(matches[0]);
      return;
    }
    if (e.key === 'Escape' && mention) { setMention(null); return; }
    if (e.key === 'Enter' && !e.shiftKey && !mention) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-6 gap-4">
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
          Mensagens
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 2 }}>
          Mural interno, visível para toda a equipe. Digite @ para referenciar um projeto ou tarefa.
        </p>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col gap-4 bg-card rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>Carregando…</div>
        ) : mensagens.length === 0 ? (
          <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>Nenhuma mensagem ainda. Seja o primeiro a escrever!</div>
        ) : mensagens.map(m => (
          <div key={m.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink-1)' }}>
                {m.autorLogin === user?.login ? 'Você' : m.autorNome}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{formatMsgTime(m.criadoEm)}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {renderMessageText(m.texto, options, onOpenProject)}
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        {mention && matches.length > 0 && (
          <div
            className="absolute bottom-full mb-2 left-0 w-full max-h-56 overflow-y-auto rounded-lg border shadow-lg z-10 bg-card"
            style={{ borderColor: 'var(--border)' }}
          >
            {matches.map(o => (
              <button
                key={`${o.kind}-${o.id}`}
                type="button"
                onClick={() => insertMention(o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent"
              >
                {o.kind === 'proj' ? <Hash size={13} color="var(--brand)" /> : <CheckSquare size={13} color="var(--success)" />}
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontSize: '0.8rem', color: 'var(--ink-1)' }}>{o.label}</div>
                  {o.sublabel && <div className="truncate" style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{o.sublabel}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 bg-card rounded-xl border p-2" style={{ borderColor: 'var(--border)' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder="Escreva uma mensagem para a equipe… use @ para referenciar um projeto ou tarefa"
            rows={2}
            className="flex-1 resize-none outline-none bg-transparent text-[13px] px-2 py-1.5"
          />
          <button
            onClick={submit}
            disabled={sending || !text.trim()}
            className="p-2 rounded-lg text-white disabled:opacity-50 flex-shrink-0"
            style={{ background: 'var(--primary)' }}
            title="Enviar"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
