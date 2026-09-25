import asyncio
from typing import Any, Dict, List

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


class MemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self._docs = docs

    def sort(self, key: str, direction: int = -1):
        self._docs = sorted(self._docs, key=lambda item: item.get(key, ""), reverse=direction == -1)
        return self

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class MemoryCollection:
    def __init__(self):
        self.docs: List[Dict[str, Any]] = []

    async def insert_one(self, document: Dict[str, Any]):
        document = dict(document)
        document["_id"] = str(len(self.docs) + 1)
        self.docs.append(document)
        return type("InsertResult", (), {"inserted_id": document["_id"]})()

    async def find_one(self, query: Dict[str, Any]):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return doc
        return None

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                patch = update.get("$set", {})
                doc.update(patch)
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

    async def delete_one(self, query: Dict[str, Any]):
        for idx, doc in enumerate(self.docs):
            if all(doc.get(key) == value for key, value in query.items()):
                del self.docs[idx]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    def find(self, query: Dict[str, Any] | None = None):
        query = query or {}
        filtered = []
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                filtered.append(doc)
        return MemoryCursor(filtered)


class MemoryDatabase:
    def __init__(self):
        self.users = MemoryCollection()
        self.cases = MemoryCollection()
        self.artifacts = MemoryCollection()
        self.chat_sessions = MemoryCollection()
        self.reports = MemoryCollection()


async def seed_demo_user() -> None:
    import bcrypt

    demo_email = "admin@recoverx.local"
    demo_password = "Password123!"

    existing = await db.users.find_one({"email": demo_email})
    if existing is not None:
        return

    await db.users.insert_one({
        "name": "Investigator One",
        "email": demo_email,
        "password_hash": bcrypt.hashpw(demo_password.encode(), bcrypt.gensalt()).decode(),
        "role": "admin",
    })


def seed_demo_user_sync() -> None:
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        try:
            asyncio.run(seed_demo_user())
        except Exception:
            pass


def should_use_mongo() -> bool:
    uri = (settings.mongo_uri or '').lower()
    if settings.use_remote_mongo:
        return True
    return 'localhost' in uri or '127.0.0.1' in uri


client = None
db = MemoryDatabase()

try:
    if should_use_mongo():
        client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
        asyncio.run(client.admin.command("ping"))
        db = client[settings.mongo_db]
    else:
        client = None
        db = MemoryDatabase()
except Exception:
    client = None
    db = MemoryDatabase()

seed_demo_user_sync()


async def ensure_db_ready() -> None:
    global client, db
    if client is None:
        db = MemoryDatabase()
        await seed_demo_user()
        return
    try:
        await client.admin.command("ping")
    except Exception:
        client = None
        db = MemoryDatabase()
        await seed_demo_user()


async def ping_mongo() -> bool:
    if client is None:
        return False
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        client = None
        db = MemoryDatabase()
        await seed_demo_user()
        return False
