"""Uma geração real e limitada, só com pergunta sintética; não imprime credenciais."""
import asyncio
import json
import os
import tempfile
from datetime import datetime, timezone

from chatkit.types import ThreadMetadata, UserMessageItem, InferenceOptions
from app import InovaServer, configured
from store import SQLiteStore


async def main():
    if not configured():
        print(json.dumps({"status": "configuracao_pendente"}))
        return 1
    with tempfile.TemporaryDirectory() as directory:
        store = SQLiteStore(directory + "/smoke.sqlite3")
        try:
            context = {"user": "smoke-real-sintetico", "role": "visualizador", "adminOverride": False,
                       "screen": {"tela": "plano", "formulario": "atividade", "campo": "Fim previsto"}}
            thread = ThreadMetadata(id="thr_smoke_real", created_at=datetime.now(timezone.utc))
            await store.save_thread(thread, context)
            message = UserMessageItem(id="msg_smoke_real", thread_id=thread.id,
                created_at=datetime.now(timezone.utc), content=[{"type": "input_text", "text": "Como preencho este campo? Cite a fonte da orientação. Não salve ou altere registros."}],
                inference_options=InferenceOptions())
            await store.add_thread_item(thread.id, message, context)
            texts = []
            events = 0
            async with asyncio.timeout(85):
                async for event in InovaServer(store).respond(thread, message, context):
                    events += 1
                    if event.type == "thread.item.done" and event.item.type == "assistant_message":
                        texts.extend(part.text for part in event.item.content)
            answer = "\n".join(texts)
            print(json.dumps({"status": "ok" if answer.strip() else "resposta_sem_texto", "modelo": os.environ["OPENAI_MODEL"],
                              "eventos": events, "caracteresResposta": len(answer), "mencionaFonte": "planoTrabalho" in answer or "FormularioAtividade" in answer}, ensure_ascii=False))
            return 0 if answer.strip() else 1
        finally:
            store.db.close()


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except Exception as error:
        # O texto da exceção do provedor pode incluir informações internas.
        print(json.dumps({"status": "falha", "tipo": type(error).__name__, "httpStatus": getattr(error, "status_code", None)}))
        raise SystemExit(1)
