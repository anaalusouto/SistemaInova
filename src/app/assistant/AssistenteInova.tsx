import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { useAuth } from "../auth/authStore";
import { conhecimento, contextoSeguro, type ContextoAssistente } from "./context";
import { responderLocal, type DadosAssistenteLocal, type PerfilLocal } from "./localBot";

const SEM_DADOS: DadosAssistenteLocal = { projetosCarregados: 0 };
export function AssistenteInova({
  contexto,
  dados = SEM_DADOS,
}: {
  contexto: ContextoAssistente;
  dados?: DadosAssistenteLocal;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState<Partial<ContextoAssistente>>({});
  const navigation = JSON.stringify(contexto);
  useEffect(() => {
    setField({});
  }, [navigation]);
  useEffect(() => {
    const focus = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement) || e.target.closest("[data-inova-assistant]")) return;
      const form = e.target.closest<HTMLElement>("[data-inova-form]");
      if (form)
        setField({
          formulario: form.dataset.inovaForm,
          campo: e.target.closest<HTMLElement>("[data-inova-field]")?.dataset.inovaField,
        });
    };
    const help = (e: Event) => {
      setField((e as CustomEvent<Partial<ContextoAssistente>>).detail);
      setOpen(true);
    };
    document.addEventListener("focusin", focus);
    window.addEventListener("inova:assistente", help);
    return () => {
      document.removeEventListener("focusin", focus);
      window.removeEventListener("inova:assistente", help);
    };
  }, []);
  const atual = contextoSeguro({ ...contexto, ...field });
  const form = conhecimento.formularios[atual.formulario as keyof typeof conhecimento.formularios];
  if (!user) return null;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-4 right-4 z-[80] flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          onClick={() => {
            if (
              atual.formulario &&
              !document.querySelector(`[data-inova-form="${atual.formulario}"]`)
            )
              setField({});
          }}
        >
          <MessageCircle size={18} aria-hidden />
          Assistente Inova
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Content
          data-inova-assistant
          className="fixed inset-y-0 right-0 z-[100] flex h-dvh w-full max-w-[480px] flex-col border-l shadow-xl focus:outline-none"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
            <MessageCircle size={20} style={{ color: "var(--primary)" }} aria-hidden />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-semibold">Assistente Inova</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Chatbot local · sem consumo de OpenAI
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fechar Assistente Inova"
              className="rounded-md p-2 hover:bg-accent"
            >
              <X size={20} />
            </Dialog.Close>
          </header>
          <div className="shrink-0 border-b px-4 py-2 text-xs text-muted-foreground">
            <p>
              Contexto:{" "}
              <strong>
                {[form?.titulo ?? atual.tela, atual.campo].filter(Boolean).join(" · ")}
              </strong>
            </p>
            <p className="mt-1">
              Guias, regras verificadas e resumos dos projetos já carregados. A conversa fica só
              nesta janela; nada é enviado à OpenAI.
            </p>
          </div>
          {open && (
            <ConversaLocal
              key={`${user.login}:${user.role}:${user.adminOverride}`}
              contexto={atual}
              dados={dados}
              perfil={user.role}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type Mensagem = { papel: "user" | "bot"; texto: string; fontes?: string[] };
function ConversaLocal({
  contexto,
  dados,
  perfil,
}: {
  contexto: ContextoAssistente;
  dados: DadosAssistenteLocal;
  perfil: PerfilLocal;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [assunto, setAssunto] = useState<string | undefined>();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const bloqueio = useRef(false);
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [mensagens]);
  const enviar = async (pergunta: string) => {
    if (!pergunta.trim() || bloqueio.current) return;
    if (pergunta.length > 1000) {
      setErro("Use até 1.000 caracteres por pergunta.");
      return;
    }
    bloqueio.current = true;
    setOcupado(true);
    setErro(null);
    try {
      const consulta =
        assunto && /^(e\b|explique melhor|mais detalhes)/i.test(pergunta.trim())
          ? `${pergunta} ${assunto}`
          : pergunta;
      const resposta = await Promise.resolve(responderLocal(consulta, contexto, dados, perfil));
      setAssunto(resposta.assunto);
      setMensagens((prev) => [
        ...prev.slice(-38),
        { papel: "user", texto: pergunta.trim() } as Mensagem,
        { papel: "bot", ...resposta } as Mensagem,
      ]);
      setTexto("");
    } catch {
      setErro(
        "Não foi possível consultar a ajuda local. Sua pergunta foi preservada; tente novamente.",
      );
    } finally {
      bloqueio.current = false;
      setOcupado(false);
      entrada.current?.focus();
    }
  };
  const sugestoes = [
    "Como preencho este campo?",
    "Explique esta tela",
    "Resumo do projeto aberto",
    "Liste os projetos",
    "Regras de negócio",
    "Índice de ajuda",
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 justify-end border-b px-3 py-1">
        <button
          type="button"
          disabled={ocupado || !mensagens.length}
          className="flex min-h-9 items-center gap-1 rounded px-2 text-xs hover:bg-accent disabled:opacity-40"
          onClick={() => {
            setMensagens([]);
            setAssunto(undefined);
            setTexto("");
            setErro(null);
            entrada.current?.focus();
          }}
        >
          <Trash2 size={13} />
          Limpar conversa
        </button>
      </div>
      <div
        ref={lista}
        role="log"
        aria-label="Conversa com Assistente Inova"
        aria-live="polite"
        aria-relevant="additions"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {!mensagens.length && (
          <p className="text-sm text-muted-foreground">
            Olá! Posso explicar os formulários ou resumir o projeto aberto. Use uma sugestão abaixo
            ou escreva uma pergunta. Se eu não encontrar uma orientação verificada, vou avisar.
          </p>
        )}
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={`max-w-full rounded-xl border p-3 text-sm ${m.papel === "user" ? "ml-6" : "mr-3"}`}
            style={{ background: m.papel === "user" ? "var(--brand-soft)" : "var(--surface-1)" }}
          >
            <p className="mb-1 text-xs font-semibold">
              {m.papel === "user" ? "Você" : "Assistente local"}
            </p>
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.texto}</p>
            {m.fontes?.length ? (
              <details className="mt-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Fontes da orientação</summary>
                <ul className="mt-1 space-y-1">
                  {m.fontes.map((f) => (
                    <li key={f} className="break-words [overflow-wrap:anywhere]">
                      {f}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t p-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {sugestoes.map((s) => (
            <button
              key={s}
              type="button"
              disabled={ocupado}
              onClick={() => void enviar(s)}
              className="min-h-8 rounded-full border px-2 py-1 text-xs hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(texto);
          }}
        >
          <label className="sr-only" htmlFor="pergunta-assistente-local">
            Sua pergunta sobre o Inova
          </label>
          <textarea
            ref={entrada}
            id="pergunta-assistente-local"
            rows={2}
            maxLength={1000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunte sobre o Inova…"
            className="w-full resize-none rounded-lg border bg-background p-2 text-sm"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Somente consulta · {texto.length}/1000
            </span>
            <button
              type="submit"
              disabled={ocupado || !texto.trim()}
              className="flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Send size={15} />
              {ocupado ? "Consultando…" : "Enviar"}
            </button>
          </div>
        </form>
        {erro && (
          <p role="alert" className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
            {erro}
          </p>
        )}
      </div>
    </div>
  );
}
