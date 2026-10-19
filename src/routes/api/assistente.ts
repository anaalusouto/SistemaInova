import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/assistente")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("../../app/assistant/gateway.server")).atenderAssistente(request),
      POST: async ({ request }) =>
        (await import("../../app/assistant/gateway.server")).atenderAssistente(request),
    },
  },
});
