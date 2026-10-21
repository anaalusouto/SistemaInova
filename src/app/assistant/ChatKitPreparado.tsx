import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { LoaderCircle, MessageCircle, RefreshCw, X } from "lucide-react";
import { useAuth } from "../auth/authStore";
import { ACCENT_SWATCH, useTheme } from "../theme/themeStore";
import { conhecimento, contextoSeguro, type ContextoAssistente } from "./context";

const SCRIPT = "https://cdn.platform.openai.com/deployments/chatkit/chatkit.js";
let loadingScript: Promise<void> | null = null;

function loadChatKit(): Promise<void> {
  if (customElements.get("openai-chatkit")) return Promise.resolve();
  if (loadingScript) return loadingScript;
  loadingScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timer = window.setTimeout(() => {
      script.remove();
      reject(
        new Error(
          "Não foi possível carregar a interface de conversa. Verifique sua conexão e tente novamente.",
        ),
      );
    }, 20000);
    script.src = SCRIPT;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(
        new Error(
          "Não foi possível carregar a interface de conversa. Verifique sua conexão e tente novamente.",
        ),
      );
    };
    customElements.whenDefined("openai-chatkit").then(() => {
      clearTimeout(timer);
      resolve();
    });
    document.head.appendChild(script);
  }).catch((e) => {
    loadingScript = null;
    throw e;
  });
  return loadingScript;
}

function nomeContexto(contexto: ContextoAssistente) {
  const formulario =
    conhecimento.formularios[contexto.formulario as keyof typeof conhecimento.formularios];
  return [formulario?.titulo ?? contexto.tela, contexto.campo].filter(Boolean).join(" · ");
}

export function AssistenteInovaChatKit({ contexto }: { contexto: ContextoAssistente }) {
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
      if (!form) return;
      const field = e.target.closest<HTMLElement>("[data-inova-field]");
      setField({ formulario: form.dataset.inovaForm, campo: field?.dataset.inovaField });
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
  const current = contextoSeguro({ ...contexto, ...field });
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
              current.formulario &&
              !document.querySelector(`[data-inova-form="${current.formulario}"]`)
            )
              setField({});
          }}
        >
          <MessageCircle size={18} aria-hidden />
          crIA
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
            borderColor: "var(--border)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
            <MessageCircle size={20} style={{ color: "var(--primary)" }} aria-hidden />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-semibold">crIA</Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground">
                Ajuda com telas e formulários. Somente orientação.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-md p-2 hover:bg-accent"
              aria-label="Fechar crIA"
            >
              <X size={20} />
            </Dialog.Close>
          </header>
          <div className="shrink-0 border-b px-4 py-2 text-xs text-muted-foreground">
            <p>
              Contexto: <strong>{nomeContexto(current)}</strong>
            </p>
            <p className="mt-1">
              Valores do formulário não são enviados. Suas mensagens são enviadas à OpenAI. Não
              inclua senhas ou dados pessoais.
            </p>
          </div>
          {open && (
            <ConexaoAssistente
              key={`${user.login}:${user.role}:${user.adminOverride}`}
              contexto={current}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ConexaoAssistente({ contexto }: { contexto: ContextoAssistente }) {
  const [status, setStatus] = useState<{ domainKey?: string; message?: string }>({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus({});
    (async () => {
      try {
        const response = await fetch("/api/assistente", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const result = await response.json();
        if (!response.ok || !result.configured)
          throw new Error(result.message ?? "Assistente temporariamente indisponível.");
        await loadChatKit();
        if (!controller.signal.aborted) setStatus({ domainKey: result.domainKey });
      } catch (e) {
        if (!controller.signal.aborted)
          setStatus({
            message:
              e instanceof Error && e.name !== "TimeoutError"
                ? e.message
                : "O assistente demorou a responder. Tente novamente.",
          });
      }
    })();
    return () => controller.abort();
  }, [attempt]);
  if (status.message)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="text-sm">
          {status.message}
        </p>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          onClick={() => setAttempt((n) => n + 1)}
        >
          <RefreshCw size={15} />
          Tentar novamente
        </button>
      </div>
    );
  if (!status.domainKey)
    return (
      <p role="status" className="flex items-center justify-center gap-2 p-6 text-sm">
        <LoaderCircle size={18} className="animate-spin" />
        Conectando ao assistente…
      </p>
    );
  return (
    <Conversa
      key={attempt}
      domainKey={status.domainKey}
      contexto={contexto}
      aoTentar={() => setAttempt((n) => n + 1)}
    />
  );
}

function Conversa({
  domainKey,
  contexto,
  aoTentar,
}: {
  domainKey: string;
  contexto: ContextoAssistente;
  aoTentar: () => void;
}) {
  const { mode, accent } = useTheme();
  const contextRef = useRef(contexto);
  contextRef.current = contexto;
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [responding, setResponding] = useState(false);
  const fetchChat = useCallback<typeof fetch>(async (input, init) => {
    setError(null);
    const payload = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    const response = await fetch(input, {
      ...init,
      credentials: "same-origin",
      body: JSON.stringify({ ...payload, metadata: { inova: contextRef.current } }),
    });
    if (!response.ok) {
      const message = await response
        .clone()
        .json()
        .catch(() => null);
      setError(message?.message ?? "Não foi possível concluir a solicitação. Tente novamente.");
      setResponding(false);
    }
    return response;
  }, []);
  const { control } = useChatKit({
    api: { url: "/api/assistente", domainKey, fetch: fetchChat },
    locale: "pt-BR",
    theme: {
      colorScheme: mode,
      color: { accent: { primary: ACCENT_SWATCH[accent], level: 2 } },
      radius: "soft",
    },
    history: { enabled: true, showDelete: false, showRename: false },
    composer: {
      placeholder: "Pergunte sobre o CRIA ou um campo…",
      attachments: { enabled: false },
    },
    startScreen: {
      greeting: "Como posso ajudar com o CRIA?",
      prompts: [
        { label: "Como preencho este campo?", prompt: "Como preencho este campo?" },
        { label: "Entender esta tela", prompt: "Explique esta tela e por onde começar." },
      ],
    },
    onReady: () => setReady(true),
    onError: () => {
      setError((e) => e ?? "A conversa está indisponível. Tente novamente.");
      setResponding(false);
    },
    onResponseStart: () => {
      setResponding(true);
      setError(null);
    },
    onResponseEnd: () => setResponding(false),
  });
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(
      () =>
        setError(
          "A interface de conversa não ficou disponível. Verifique a conexão e o domínio configurado.",
        ),
      20000,
    );
    return () => clearTimeout(timer);
  }, [ready]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!ready && !error && (
        <p role="status" className="p-4 text-sm">
          Carregando conversa…
        </p>
      )}
      {responding && (
        <p role="status" className="px-4 pt-2 text-xs text-muted-foreground">
          Preparando orientação…
        </p>
      )}
      {error && (
        <div className="border-b p-3 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" onClick={aoTentar} className="mt-2 underline">
            Reconectar
          </button>
        </div>
      )}
      <ChatKit control={control} className="block min-h-0 w-full flex-1" />
    </div>
  );
}
