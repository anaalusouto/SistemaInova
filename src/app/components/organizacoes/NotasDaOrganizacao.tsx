/**
 * Notas da equipe sobre a organização: vários post-its (0017).
 *
 * Desde a navegação centrada na organização (29/09/2026) as notas moram na
 * seção "Encaminhamentos e notas", ao lado da tabela de encaminhamentos —
 * como no slide 5. O popover "Notas e encaminhamentos" do cabeçalho saiu: a
 * seção faz o mesmo papel sem esconder o conteúdo atrás de um clique.
 */
import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { LIMITE_NOTA, type NotaOrganizacao, type OrganizacaoFicha } from '../../lib/organizacoes';
import { useEscritaOrganizacao } from './useOrganizacoes';
import { BotaoNovo } from '../BotaoNovo';
import { ConfirmarExclusao } from '../plano/camposFormulario';

export function NotasDaOrganizacao({ org }: { org: OrganizacaoFicha }) {
  const { readOnly } = useAuth();
  // Rascunho de nota nova: só vira linha no banco quando a pessoa salva —
  // "Nova nota" seguido de fechar o popover não deixa post-it vazio para trás.
  const [rascunho, setRascunho] = useState(false);

  return (
    <section className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Notas da equipe{org.notas.length ? ` (${org.notas.length})` : ''}
        </h3>
        {!readOnly && !rascunho && <BotaoNovo onClick={() => setRascunho(true)}>Nova nota</BotaoNovo>}
      </div>

      <div className="flex flex-col gap-3">
        {rascunho && <PostIt org={org} nota={null} aoTerminarRascunho={() => setRascunho(false)} />}
        {org.notas.map(n => <PostIt key={n.id} org={org} nota={n} />)}
        {!rascunho && org.notas.length === 0 && (
          <p style={{ fontSize: '0.76rem', color: 'var(--ink-5)', fontStyle: 'italic' }}>Nenhuma nota ainda.</p>
        )}
      </div>
    </section>
  );
}

/**
 * Um post-it (UI/UX): cartão amarelo suave com sombra, cabeçalho com autoria
 * e a lixeira, e a área de texto redimensionável pelo canto.
 *
 * `nota === null` é o rascunho de uma nota nova.
 */
function PostIt({
  org, nota, aoTerminarRascunho,
}: {
  org: OrganizacaoFicha;
  nota: NotaOrganizacao | null;
  aoTerminarRascunho?: () => void;
}) {
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const salva = nota?.conteudo ?? '';
  const versaoSalva = nota?.versao ?? 0;

  // `base` é o texto da versão que a pessoa abriu; `versaoBase`, o número
  // dela. Alterado = o texto na tela difere da base.
  const [texto, setTexto] = useState(salva);
  const [base, setBase] = useState(salva);
  const [versaoBase, setVersaoBase] = useState(versaoSalva);
  const [salvando, setSalvando] = useState(false);
  const [conflito, setConflito] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const pendente = texto !== base;

  // Outra pessoa salvou esta nota enquanto o popover estava aberto. Sem
  // alteração local, mostra a versão nova; com alteração, preserva o que a
  // pessoa escreveu — o servidor recusa ao salvar e o aviso de conflito aparece.
  useEffect(() => {
    if (versaoSalva === versaoBase || pendente) return;
    setTexto(salva);
    setBase(salva);
    setVersaoBase(versaoSalva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoSalva]);

  const registrar = (action: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'organizações', action, detail: org.nome, kind: 'alteracao' });

  const salvar = async () => {
    if (!texto.trim()) { toast.error('A nota está vazia.'); return; }
    setSalvando(true);
    try {
      if (!nota) {
        await escrita.criarNota(org.id, texto);
        registrar('criar nota');
        toast.success('Nota criada.');
        aoTerminarRascunho?.();
      } else {
        const nova = await escrita.salvarNota(nota.id, texto, versaoBase);
        setBase(texto);
        setVersaoBase(nova);
        setConflito(false);
        registrar('editar nota');
        toast.success('Nota salva.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível salvar a nota.';
      if (msg.startsWith('Outra pessoa salvou')) setConflito(true);
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    setExcluindo(false);
    if (!nota) return;
    try {
      await escrita.excluirNota(nota.id);
      registrar('excluir nota');
      toast.success('Nota excluída.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir a nota.');
    }
  };

  const usarVersaoSalva = () => {
    setTexto(salva);
    setBase(salva);
    setVersaoBase(versaoSalva);
    setConflito(false);
  };

  const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const autoria = !nota
    ? 'Nova nota'
    : nota.atualizadoPor && nota.atualizadoEm !== nota.criadoEm
      ? `${nota.atualizadoPor} · ${quando(nota.atualizadoEm)}`
      : `${nota.criadoPor ?? nota.atualizadoPor ?? '—'} · ${quando(nota.criadoEm)}`;

  return (
    <article
      className="rounded-lg border overflow-hidden"
      style={{
        background: 'var(--warning-soft)',
        borderColor: 'var(--warning-soft-border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 6px 14px -8px rgba(146,64,14,0.35)',
      }}
    >
      <header
        className="flex items-center justify-between gap-2 px-2.5 py-1.5"
        style={{ borderBottom: '1px dashed var(--warning-soft-border)' }}
      >
        <span style={{ fontSize: '0.68rem', color: 'var(--warning-strong-text)', fontWeight: 600 }}>{autoria}</span>
        {!readOnly && nota && (
          <button type="button" onClick={() => setExcluindo(true)} aria-label="Excluir nota" className="p-1 rounded hover:bg-black/5">
            <Trash2 size={12} color="var(--danger)" />
          </button>
        )}
        {!readOnly && !nota && (
          <button type="button" onClick={aoTerminarRascunho} aria-label="Descartar nota nova" className="p-1 rounded hover:bg-black/5">
            <X size={12} color="var(--ink-4)" />
          </button>
        )}
      </header>

      <textarea
        value={texto}
        onChange={e => setTexto(e.target.value)}
        readOnly={readOnly}
        autoFocus={!nota}
        maxLength={LIMITE_NOTA}
        rows={5}
        placeholder="Anotações livres sobre a organização, visíveis para toda a equipe."
        aria-label="Texto da nota"
        className="w-full px-2.5 py-2 block focus:outline-none"
        style={{ background: 'transparent', color: 'var(--ink-1)', fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical', minHeight: 72 }}
      />

      {!readOnly && (pendente || !nota) && (
        <div className="flex justify-end px-2.5 pb-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || !texto.trim()}
            className="px-3 py-1 rounded-md text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)', opacity: salvando || !texto.trim() ? 0.5 : 1 }}
          >
            {salvando ? 'Salvando…' : 'Salvar nota'}
          </button>
        </div>
      )}

      {conflito && (
        <div className="mx-2.5 mb-2 rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--danger-soft-border)', background: 'var(--danger-soft)', fontSize: '0.74rem', color: 'var(--danger)' }} role="alert">
          Outra pessoa salvou esta nota enquanto você escrevia. O seu texto continua acima: copie o que quiser manter antes de
          {' '}
          <button type="button" onClick={usarVersaoSalva} className="underline font-medium">carregar a versão salva</button>.
        </div>
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir esta nota?"
          descricao="A nota sai para toda a equipe. Não dá para desfazer."
          aoCancelar={() => setExcluindo(false)}
          aoConfirmar={() => void excluir()}
        />
      )}
    </article>
  );
}
