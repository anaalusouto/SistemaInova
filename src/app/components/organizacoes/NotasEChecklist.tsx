/**
 * Notas e encaminhamentos (Anotações e Tarefas, opção 1).
 *
 * Um botão de ação rápida que abre, num popover, o bloco de notas da
 * organização e a lista de encaminhamentos pendentes. Aparece na ficha da
 * organização e no cabeçalho do projeto; pelo projeto, abre o da organização
 * executora dele. É sempre a mesma fonte, vista de dois lugares.
 *
 * A checklist NÃO é uma lista nova: são os Encaminhamentos do RC-04. Marcar
 * aqui conclui lá; criar aqui cria lá. Duas listas de tarefas para a mesma
 * organização acabariam discordando.
 */
import { useEffect, useState } from 'react';
import { StickyNote, Loader2, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { formatDateOnly } from '../../lib/dateOnly';
import { LIMITE_NOTA, type Encaminhamento, type OrganizacaoFicha } from '../../lib/organizacoes';
import { useFichaOrganizacao, useEscritaOrganizacao } from './useOrganizacoes';

export function BotaoNotasEChecklist({
  organizacaoId, aoVerTodos,
}: {
  /** Null quando o projeto não tem organização vinculada. */
  organizacaoId: string | null;
  /** Leva à aba Encaminhamentos, quando se está na ficha da organização. */
  aoVerTodos?: () => void;
}) {
  const [aberto, setAberto] = useState(false);

  if (!organizacaoId) {
    return (
      <button
        disabled
        title="Este projeto não está vinculado a uma organização."
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-5)', cursor: 'not-allowed' }}
      >
        <StickyNote size={13} /> Notas e encaminhamentos
      </button>
    );
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
          style={{ borderColor: 'var(--brand-soft-border)', color: 'var(--brand)', background: 'var(--brand-soft)' }}
          aria-haspopup="dialog"
        >
          <StickyNote size={13} /> Notas e encaminhamentos
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="p-0"
        style={{ width: 'min(92vw, 440px)', background: 'var(--surface-0)', borderColor: 'var(--border)' }}
      >
        {/* Só busca a ficha quando abre: o cabeçalho do projeto não precisa
            carregar notas e encaminhamentos de ninguém até alguém pedir. */}
        {aberto && <Conteudo organizacaoId={organizacaoId} aoVerTodos={aoVerTodos ? () => { setAberto(false); aoVerTodos(); } : undefined} />}
      </PopoverContent>
    </Popover>
  );
}

function Conteudo({ organizacaoId, aoVerTodos }: { organizacaoId: string; aoVerTodos?: () => void }) {
  const { data: org, isLoading, error } = useFichaOrganizacao(organizacaoId);

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 size={18} className="animate-spin" color="var(--ink-5)" /></div>;
  }
  if (error || !org) {
    return <div className="p-4" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Não foi possível abrir. {(error as Error | null)?.message}</div>;
  }
  return (
    <div className="flex flex-col max-h-[80vh] overflow-y-auto" role="dialog" aria-label={`Notas e encaminhamentos de ${org.nome}`}>
      <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>Organização</div>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink-1)' }}>{org.nome}</div>
      </div>
      <BlocoDeNotas org={org} />
      <Checklist org={org} aoVerTodos={aoVerTodos} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notas
// ---------------------------------------------------------------------------

function BlocoDeNotas({ org }: { org: OrganizacaoFicha }) {
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const salva = org.nota?.conteudo ?? '';
  const versaoSalva = org.nota?.versao ?? 0;

  // `base` é o texto da versão que a pessoa abriu; `versaoBase`, o número
  // dela. Alterado = o texto na tela difere da base.
  const [texto, setTexto] = useState(salva);
  const [base, setBase] = useState(salva);
  const [versaoBase, setVersaoBase] = useState(versaoSalva);
  const [expandido, setExpandido] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [conflito, setConflito] = useState(false);
  const pendente = texto !== base;

  // Outra pessoa salvou enquanto o popover estava aberto. Sem alteração local,
  // mostra a versão nova; com alteração, preserva o que a pessoa escreveu — o
  // servidor recusa ao salvar e o aviso de conflito aparece.
  useEffect(() => {
    if (versaoSalva === versaoBase || pendente) return;
    setTexto(salva);
    setBase(salva);
    setVersaoBase(versaoSalva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoSalva]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const nova = await escrita.salvarNota(org.id, texto, versaoBase);
      setBase(texto);
      setVersaoBase(nova);
      setConflito(false);
      audit({ userLogin: user?.login ?? '—', area: 'organizações', action: 'editar notas', detail: org.nome, kind: 'alteracao' });
      toast.success('Nota salva.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível salvar a nota.';
      if (msg.startsWith('Outra pessoa salvou')) setConflito(true);
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const usarVersaoSalva = () => {
    setTexto(salva);
    setBase(salva);
    setVersaoBase(versaoSalva);
    setConflito(false);
  };

  return (
    <section className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Notas da equipe
        </h3>
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="inline-flex items-center gap-1"
          style={{ fontSize: '0.7rem', color: 'var(--ink-4)' }}
          aria-label={expandido ? 'Reduzir o bloco de notas' : 'Expandir o bloco de notas'}
        >
          {expandido ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          {expandido ? 'Reduzir' : 'Expandir'}
        </button>
      </div>

      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        readOnly={readOnly}
        maxLength={LIMITE_NOTA}
        rows={expandido ? 16 : 6}
        placeholder={readOnly ? 'Nenhuma nota.' : 'Anotações livres sobre a organização, visíveis para toda a equipe.'}
        className="w-full rounded-lg border px-2.5 py-2"
        style={{
          borderColor: 'var(--warning-soft-border, var(--border))',
          background: 'var(--warning-soft)',
          color: 'var(--ink-1)',
          fontSize: '0.8rem',
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
        <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
          {org.nota?.atualizadoPor
            ? `Alterada por ${org.nota.atualizadoPor} em ${new Date(org.nota.atualizadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
            : 'Ainda sem anotações.'}
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={salvar}
            disabled={!pendente || salvando}
            className="px-3 py-1 rounded-md text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)', opacity: !pendente || salvando ? 0.5 : 1 }}
          >
            {salvando ? 'Salvando…' : 'Salvar nota'}
          </button>
        )}
      </div>

      {conflito && (
        <div className="mt-2 rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--danger-soft-border)', background: 'var(--danger-soft)', fontSize: '0.74rem', color: 'var(--danger)' }} role="alert">
          Outra pessoa salvou esta nota enquanto você escrevia. O seu texto continua acima: copie o que quiser manter antes de
          {' '}
          <button type="button" onClick={usarVersaoSalva} className="underline font-medium">carregar a versão salva</button>.
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Checklist = Encaminhamentos pendentes (RC-04)
// ---------------------------------------------------------------------------

function Checklist({ org, aoVerTodos }: { org: OrganizacaoFicha; aoVerTodos?: () => void }) {
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const [novo, setNovo] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);

  const pendentes = org.encaminhamentos.filter(e => e.status !== 'Concluído');
  const registrar = (action: string, detail: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'organizações', action, detail: `${org.nome} · ${detail}`, kind: 'alteracao' });

  const concluir = async (e: Encaminhamento) => {
    setOcupado(e.id);
    try {
      await escrita.atualizarEncaminhamento(e.id, {
        organizacaoId: org.id, descricao: e.descricao, responsavel: e.responsavel ?? '',
        dataInicio: e.dataInicio, dataFim: e.dataFim, status: 'Concluído', origem: e.origem,
      });
      registrar('concluir encaminhamento', e.descricao);
      toast.success('Encaminhamento concluído.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setOcupado(null);
    }
  };

  const criar = async () => {
    const descricao = novo.trim();
    if (!descricao) return;
    setOcupado('novo');
    try {
      await escrita.criarEncaminhamento({
        organizacaoId: org.id, descricao, responsavel: '', dataInicio: null, dataFim: null,
        status: 'A iniciar', origem: null,
      });
      registrar('novo encaminhamento', descricao);
      setNovo('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar.');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Encaminhamentos pendentes ({pendentes.length})
        </h3>
        {aoVerTodos && (
          <button type="button" onClick={aoVerTodos} className="hover:underline" style={{ fontSize: '0.7rem', color: 'var(--brand-text)' }}>
            Ver todos
          </button>
        )}
      </div>

      {pendentes.length === 0 ? (
        <p style={{ fontSize: '0.76rem', color: 'var(--ink-5)' }}>Nenhum encaminhamento pendente.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {pendentes.map(e => (
            <li key={e.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={false}
                disabled={readOnly || ocupado === e.id}
                onChange={() => void concluir(e)}
                aria-label={`Concluir: ${e.descricao}`}
                style={{ marginTop: 3 }}
              />
              <div className="min-w-0">
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-1)', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{e.descricao}</div>
                {(e.responsavel || e.dataFim || e.status === 'Em andamento') && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
                    {[e.responsavel, e.dataFim && `até ${formatDateOnly(e.dataFim)}`, e.status === 'Em andamento' && 'em andamento']
                      .filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex items-center gap-1.5 mt-3">
          <input
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void criar(); } }}
            placeholder="Novo encaminhamento"
            aria-label="Descrição do novo encaminhamento"
            className="flex-1 min-w-0 border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.78rem' }}
          />
          <button
            type="button"
            onClick={() => void criar()}
            disabled={!novo.trim() || ocupado === 'novo'}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)', opacity: !novo.trim() || ocupado === 'novo' ? 0.5 : 1 }}
            aria-label="Adicionar encaminhamento"
          >
            <Plus size={12} /> Adicionar
          </button>
        </div>
      )}
      <p style={{ fontSize: '0.66rem', color: 'var(--ink-5)', marginTop: 8 }}>
        É a mesma lista da aba Encaminhamentos da organização. Responsável, datas e origem se editam lá.
      </p>
    </section>
  );
}
