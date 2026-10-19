import { createHmac } from "node:crypto";
import { exigirSessao, NaoAutorizado, type UsuarioSessao } from "../sessao.server";
import { validarProtocolo } from "./protocol";

type Dependencias = {
  autenticar?: () => Promise<UsuarioSessao>;
  enviar?: typeof fetch;
  env?: NodeJS.ProcessEnv;
};
const json = (status: number, message: string, extra = {}) =>
  Response.json({ message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export async function atenderAssistente(
  request: Request,
  deps: Dependencias = {},
): Promise<Response> {
  let usuario: UsuarioSessao;
  try {
    usuario = await (deps.autenticar ?? exigirSessao)();
  } catch (e) {
    return json(
      e instanceof NaoAutorizado ? 401 : 503,
      e instanceof NaoAutorizado
        ? "Sua sessão expirou. Entre novamente para usar o assistente."
        : "Não foi possível validar sua sessão. Tente novamente.",
    );
  }
  const env = deps.env ?? process.env;
  if (env.INOVA_OPENAI_ENABLED !== "true")
    return json(503, "Conexão OpenAI pausada. Use o chatbot local do CRIA.", {
      configured: false,
    });
  const enviar = deps.enviar ?? fetch;
  const url = env.INOVA_ASSISTANT_URL;
  const secret = env.INOVA_ASSISTANT_SECRET;
  const domainKey = env.CHATKIT_DOMAIN_KEY;
  if (!url || !secret || secret.length < 32 || !domainKey)
    return json(
      503,
      "Conexão real ainda não configurada. Solicite a configuração do Assistente CRIA ao administrador.",
      { configured: false },
    );
  let base: URL;
  try {
    base = new URL(url);
    if (
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== "/" ||
      (base.protocol !== "https:" &&
        !(
          env.NODE_ENV !== "production" &&
          base.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(base.hostname)
        ))
    )
      throw new Error();
  } catch {
    return json(
      503,
      "O endereço do serviço do assistente precisa ser configurado pelo administrador.",
    );
  }
  if (request.method === "POST") {
    const origem = request.headers.get("origin");
    if (
      !origem ||
      origem !== new URL(request.url).origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return json(403, "Origem da solicitação não permitida.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json(415, "Envie uma mensagem de texto.");
  } else if (request.method !== "GET") return json(405, "Operação não permitida.");
  let body = "";
  if (request.method === "POST") {
    // Limita também corpos sem Content-Length, antes de carregar tudo em memória.
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          return json(413, "Mensagem muito longa. Use até 4.000 caracteres.");
        }
        chunks.push(value);
      }
    }
    try {
      body = JSON.stringify(validarProtocolo(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
    } catch {
      return json(
        400,
        "Solicitação inválida. Envie apenas texto com até 4.000 caracteres; anexos e ações não estão disponíveis.",
      );
    }
  }
  const identity = Buffer.from(
    JSON.stringify({
      user: createHmac("sha256", secret).update(`inova-assistant:${usuario.id}`).digest("hex"),
      role: usuario.role,
      adminOverride: usuario.adminOverride,
    }),
  ).toString("base64url");
  const timestamp = String(Math.floor(Date.now() / 1000));
  const path = request.method === "GET" ? "/health" : "/chatkit";
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}\n${identity}\n${path}\n${body}`)
    .digest("hex");
  try {
    const response = await enviar(new URL(path, base), {
      method: request.method,
      body: body || undefined,
      headers: {
        "Content-Type": "application/json",
        "X-Inova-Identity": identity,
        "X-Inova-Timestamp": timestamp,
        "X-Inova-Signature": signature,
      },
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(90000)]),
    });
    if (!response.ok) {
      const status = [400, 401, 403, 404, 429, 503].includes(response.status)
        ? response.status
        : 502;
      const message =
        status === 404
          ? "Conversa não encontrada para seu usuário."
          : status === 429
            ? "Muitas solicitações. Aguarde um minuto e tente novamente."
            : status === 503
              ? "Assistente indisponível ou conexão real ainda não configurada."
              : "Não foi possível concluir a solicitação ao assistente.";
      return json(status, message);
    }
    if (request.method === "GET")
      return json(200, "Assistente disponível.", { configured: true, domainKey });
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json(
      503,
      "O assistente está temporariamente indisponível. Tente novamente em instantes.",
    );
  }
}
