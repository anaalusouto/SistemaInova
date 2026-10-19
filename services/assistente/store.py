"""SQLite persistente para uma instância, sempre filtrado pelo proprietário autenticado."""
import sqlite3
import uuid
from pathlib import Path

from pydantic import TypeAdapter
from chatkit.store import Store, NotFoundError
from chatkit.types import Page, ThreadItem, ThreadMetadata

item_adapter = TypeAdapter(ThreadItem)


class SQLiteStore(Store[dict]):
    def generate_thread_id(self, context):
        return f"thr_{uuid.uuid4().hex}"

    def generate_item_id(self, item_type, thread, context):
        return f"item_{uuid.uuid4().hex}"

    def __init__(self, path: str):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS threads (
                id TEXT PRIMARY KEY, owner TEXT NOT NULL, data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS threads_owner ON threads(owner);
            CREATE TABLE IF NOT EXISTS items (
                thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
                id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(thread_id, id)
            );
        """)
        self.db.commit()

    async def load_thread(self, thread_id, context):
        row = self.db.execute("SELECT data FROM threads WHERE id=? AND owner=?", (thread_id, context["user"])).fetchone()
        if row is None:
            raise NotFoundError("Conversa não encontrada.")
        return ThreadMetadata.model_validate_json(row[0])

    async def save_thread(self, thread, context):
        row = self.db.execute("SELECT owner FROM threads WHERE id=?", (thread.id,)).fetchone()
        if row and row[0] != context["user"]:
            raise NotFoundError("Conversa não encontrada.")
        with self.db:
            self.db.execute("INSERT INTO threads(id,owner,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE owner=excluded.owner",
                            (thread.id, context["user"], thread.model_dump_json()))

    def _page(self, table, filters, args, after, limit, order, parse):
        limit = min(max(limit, 1), 50)
        direction = "DESC" if order == "desc" else "ASC"
        operator = "<" if order == "desc" else ">"
        if after:
            cursor = self.db.execute(f"SELECT rowid FROM {table} WHERE {filters} AND id=?", (*args, after)).fetchone()
            if cursor is None:
                raise NotFoundError("Cursor não encontrado.")
            filters += f" AND rowid {operator} ?"
            args = (*args, cursor[0])
        rows = self.db.execute(f"SELECT data FROM {table} WHERE {filters} ORDER BY rowid {direction} LIMIT ?", (*args, limit + 1)).fetchall()
        data = [parse(row[0]) for row in rows[:limit]]
        more = len(rows) > limit
        return Page(data=data, has_more=more, after=data[-1].id if more else None)

    async def load_threads(self, limit, after, order, context):
        return self._page("threads", "owner=?", (context["user"],), after, limit, order, ThreadMetadata.model_validate_json)

    async def load_thread_items(self, thread_id, after, limit, order, context):
        await self.load_thread(thread_id, context)
        return self._page("items", "thread_id=?", (thread_id,), after, limit, order, item_adapter.validate_json)

    async def add_thread_item(self, thread_id, item, context):
        await self.save_item(thread_id, item, context)

    async def save_item(self, thread_id, item, context):
        await self.load_thread(thread_id, context)
        if item.thread_id != thread_id:
            raise NotFoundError("Item não encontrado.")
        with self.db:
            self.db.execute("INSERT INTO items(thread_id,id,data) VALUES(?,?,?) ON CONFLICT(thread_id,id) DO UPDATE SET data=excluded.data",
                            (thread_id, item.id, item.model_dump_json()))

    async def load_item(self, thread_id, item_id, context):
        await self.load_thread(thread_id, context)
        row = self.db.execute("SELECT data FROM items WHERE thread_id=? AND id=?", (thread_id, item_id)).fetchone()
        if row is None:
            raise NotFoundError("Item não encontrado.")
        return item_adapter.validate_json(row[0])

    async def delete_thread(self, thread_id, context):
        await self.load_thread(thread_id, context)
        with self.db:
            self.db.execute("DELETE FROM threads WHERE id=? AND owner=?", (thread_id, context["user"]))

    async def delete_thread_item(self, thread_id, item_id, context):
        await self.load_thread(thread_id, context)
        with self.db:
            self.db.execute("DELETE FROM items WHERE thread_id=? AND id=?", (thread_id, item_id))

    async def save_attachment(self, attachment, context):
        raise PermissionError("Anexos indisponíveis.")

    async def load_attachment(self, attachment_id, context):
        raise NotFoundError("Anexos indisponíveis.")

    async def delete_attachment(self, attachment_id, context):
        raise PermissionError("Anexos indisponíveis.")
