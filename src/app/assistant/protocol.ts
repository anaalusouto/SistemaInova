import { z } from "zod";
import { contextoSeguro } from "./context";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const pagina = z
  .object({
    limit: z.number().int().min(1).max(50).nullish(),
    after: id.nullish(),
    order: z.enum(["asc", "desc"]).optional(),
  })
  .strict();
const entrada = z
  .object({
    content: z
      .array(
        z
          .object({ type: z.literal("input_text"), text: z.string().trim().min(1).max(4000) })
          .strict(),
      )
      .min(1)
      .max(1),
    attachments: z.array(z.never()).max(0).optional(),
    quoted_text: z.null().optional(),
    inference_options: z
      .object({ model: z.null().optional(), tool_choice: z.null().optional() })
      .strict()
      .optional(),
  })
  .strict()
  .transform((v) => ({ ...v, attachments: [], inference_options: {} }));
const requisicao = z.discriminatedUnion("type", [
  z.object({ type: z.literal("threads.create"), params: z.object({ input: entrada }).strict() }),
  z.object({
    type: z.literal("threads.add_user_message"),
    params: z.object({ thread_id: id, input: entrada }).strict(),
  }),
  z.object({ type: z.literal("threads.get_by_id"), params: z.object({ thread_id: id }).strict() }),
  z.object({ type: z.literal("threads.list"), params: pagina }),
  z.object({ type: z.literal("items.list"), params: pagina.extend({ thread_id: id }) }),
]);

/** Metadados não têm autoridade: identidade/perfil vêm exclusivamente da sessão. */
export function validarProtocolo(raw: unknown) {
  const envelope = z
    .object({ type: z.string(), params: z.unknown(), metadata: z.unknown().optional() })
    .strict()
    .parse(raw);
  const pedido = requisicao.parse({ type: envelope.type, params: envelope.params });
  const metadata = envelope.metadata as { inova?: unknown } | undefined;
  return { ...pedido, metadata: { inova: contextoSeguro(metadata?.inova) } };
}
