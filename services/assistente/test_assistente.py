import asyncio
import base64
import hashlib
import hmac
import json
import os
import tempfile
import time
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from chatkit.types import AssistantMessageItem, AssistantMessageContent, ThreadItemDoneEvent, ThreadMetadata, UserMessageItem, InferenceOptions
from chatkit.store import NotFoundError
from fastapi.testclient import TestClient

import app as service
from security import authorize_tool, safe_context, verify_identity
from store import SQLiteStore

SECRET = "synthetic-test-secret-at-least-32-characters"
A = {"user": "a" * 64, "role": "visualizador", "adminOverride": False}
B = {"user": "b" * 64, "role": "admin", "adminOverride": True}


def headers(identity=A, body=b"", path="/chatkit", timestamp=None):
    stamp = str(int(time.time()) if timestamp is None else timestamp)
    encoded = base64.urlsafe_b64encode(json.dumps(identity).encode()).decode().rstrip("=")
    signed = stamp.encode() + b"\n" + encoded.encode() + b"\n" + path.encode() + b"\n" + body
    return {"content-type": "application/json", "x-inova-identity": encoded, "x-inova-timestamp": stamp,
            "x-inova-signature": hmac.new(SECRET.encode(), signed, hashlib.sha256).hexdigest()}


def entry(text="Como preencho?"):
    return {"content": [{"type": "input_text", "text": text}], "attachments": [], "inference_options": {}}


class StoreTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = SQLiteStore(self.tmp.name + "/conversations.sqlite3")
        self.thread = ThreadMetadata(id="thr_a", created_at=datetime.now(timezone.utc))
        await self.store.save_thread(self.thread, A)
        self.item = UserMessageItem(id="msg_a", thread_id="thr_a", created_at=datetime.now(timezone.utc),
                                    content=[{"type": "input_text", "text": "pergunta sintética"}], inference_options=InferenceOptions())
        await self.store.add_thread_item("thr_a", self.item, A)

    async def asyncTearDown(self):
        self.store.db.close()
        self.tmp.cleanup()

    async def test_other_user_cannot_access_or_modify_even_as_admin(self):
        operations = [lambda: self.store.load_thread("thr_a", B), lambda: self.store.save_thread(self.thread, B),
                      lambda: self.store.load_thread_items("thr_a", None, 20, "asc", B),
                      lambda: self.store.load_item("thr_a", "msg_a", B), lambda: self.store.save_item("thr_a", self.item, B),
                      lambda: self.store.delete_thread("thr_a", B), lambda: self.store.delete_thread_item("thr_a", "msg_a", B)]
        for operation in operations:
            with self.assertRaises(NotFoundError):
                await operation()
        self.assertEqual((await self.store.load_threads(20, None, "desc", B)).data, [])
        self.assertEqual((await self.store.load_item("thr_a", "msg_a", A)).id, "msg_a")

    async def test_persistence_and_pagination(self):
        for i in range(4):
            await self.store.save_thread(ThreadMetadata(id=f"thr_{i}", created_at=datetime.now(timezone.utc)), A)
        first = await self.store.load_threads(2, None, "desc", A)
        second = await self.store.load_threads(2, first.after, "desc", A)
        self.assertTrue(first.has_more)
        self.assertFalse({x.id for x in first.data} & {x.id for x in second.data})
        reopened = SQLiteStore(self.tmp.name + "/conversations.sqlite3")
        self.assertEqual((await reopened.load_item("thr_a", "msg_a", A)).content[0].text, "pergunta sintética")
        reopened.db.close()

    async def test_foreign_cursor_and_cross_thread_item_are_rejected(self):
        await self.store.save_thread(ThreadMetadata(id="thr_b", created_at=datetime.now(timezone.utc)), B)
        with self.assertRaises(NotFoundError):
            await self.store.load_threads(20, "thr_b", "desc", A)
        with self.assertRaises(NotFoundError):
            await self.store.save_item("thr_a", self.item.model_copy(update={"thread_id": "thr_b"}), A)


class SecurityTests(unittest.TestCase):
    def test_signature_expiry_path_and_body(self):
        self.assertEqual(verify_identity(headers(body=b"abc"), "/chatkit", b"abc", SECRET), A)
        for head, path, body in [(headers(body=b"abc"), "/chatkit", b"changed"), (headers(), "/health", b""), (headers(timestamp=0), "/chatkit", b""), ({}, "/chatkit", b"")]:
            with self.assertRaises((ValueError, TypeError)):
                verify_identity(head, path, body, SECRET)

    def test_context_and_tools(self):
        self.assertEqual(safe_context({"tela": "plano", "formulario": "risco", "campo": "Impacto", "cpf": "não enviar"}, service.KNOWLEDGE), {"tela": "plano", "formulario": "risco", "campo": "Impacto"})
        self.assertEqual(safe_context({"tela": [], "formulario": {}}, service.KNOWLEDGE), {"tela": "overview"})
        for user in [A, B]:
            with self.assertRaises(PermissionError):
                authorize_tool(user, "criarProjeto")


class ProtocolTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = SQLiteStore(self.tmp.name + "/test.sqlite3")
        service._server = service.InovaServer(self.store)
        service._calls.clear()
        service._active.clear()
        self.env = patch.dict(os.environ, {"OPENAI_API_KEY": "synthetic-not-a-real-key", "OPENAI_MODEL": "test-model", "INOVA_ASSISTANT_SECRET": SECRET})
        self.env.start()
        self.client = TestClient(service.app)

    def tearDown(self):
        self.client.close()
        self.store.db.close()
        service._server = None
        self.env.stop()
        self.tmp.cleanup()

    def post(self, payload, user=A):
        body = json.dumps(payload).encode()
        return self.client.post("/chatkit", content=body, headers=headers(user, body))

    def test_authentication_health_and_unconfigured(self):
        self.assertEqual(self.client.get("/health").status_code, 401)
        self.assertEqual(self.client.get("/health", headers=headers(path="/health")).status_code, 200)
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            self.assertEqual(self.client.get("/health", headers=headers(path="/health")).status_code, 503)

    def test_chatkit_real_protocol_persistence_isolation_and_stream(self):
        # Usa o servidor/protocolo oficial; só a geração do texto é substituída, sem chamada paga.
        async def respond(_self, thread, input, context):
            yield ThreadItemDoneEvent(item=AssistantMessageItem(id="msg_response", thread_id=thread.id,
                created_at=datetime.now(timezone.utc), content=[AssistantMessageContent(text="Orientação sintética em português.")]))
        with patch.object(service.InovaServer, "respond", respond):
            response = self.post({"type": "threads.create", "params": {"input": entry()}})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIn("thread.created", response.text)
        self.assertIn("Orientação sintética", response.text)
        threads = self.post({"type": "threads.list", "params": {}}).json()["data"]
        self.assertEqual(len(threads), 1)
        thread_id = threads[0]["id"]
        for kind, params in [("threads.get_by_id", {"thread_id": thread_id}), ("items.list", {"thread_id": thread_id}),
                             ("threads.add_user_message", {"thread_id": thread_id, "input": entry()})]:
            self.assertEqual(self.post({"type": kind, "params": params}, B).status_code, 404)
        self.assertEqual(self.post({"type": "threads.list", "params": {}}, B).json()["data"], [])
        own = self.post({"type": "threads.get_by_id", "params": {"thread_id": thread_id}})
        self.assertEqual(own.status_code, 200)
        self.assertIn("Orientação sintética", own.text)

    def test_mutations_attachments_and_limits(self):
        for operation in ["threads.custom_action", "threads.add_client_tool_output", "threads.delete", "attachments.create"]:
            self.assertEqual(self.post({"type": operation, "params": {}}).status_code, 400)
        bad = entry(); bad["attachments"] = ["atc_1"]
        self.assertEqual(self.post({"type": "threads.create", "params": {"input": bad}}).status_code, 400)
        service._active.add(A["user"])
        self.assertEqual(self.post({"type": "threads.create", "params": {"input": entry()}}).status_code, 429)

    def test_real_agent_instructions_model_and_no_tools(self):
        async def run():
            thread = ThreadMetadata(id="thr_agent", created_at=datetime.now(timezone.utc))
            await self.store.save_thread(thread, A)
            async def fake_stream(context, result):
                if False:
                    yield None
            with patch.object(service.Runner, "run_streamed", return_value=object()) as runner, patch.object(service, "stream_agent_response", fake_stream):
                async for _ in service._server.respond(thread, None, {**A, "screen": {"tela": "plano", "formulario": "atividade", "campo": "Fim previsto"}}):
                    pass
                agent = runner.call_args.args[0]
                self.assertEqual(agent.model, "test-model")
                self.assertEqual(agent.tools, [])
                self.assertFalse(agent.model_settings.store)
                self.assertIn("visualizador", agent.instructions)
                self.assertIn("Fim previsto", agent.instructions)
                self.assertIn("Não invente", agent.instructions)
                self.assertTrue(runner.call_args.kwargs["run_config"].tracing_disabled)
        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
