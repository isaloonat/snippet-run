import aiosqlite
import os

DATABASE_URL = os.getenv("DATABASE_URL", "./snippets.db")

async def init_db():
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS snippets (
                id TEXT PRIMARY KEY,
                language TEXT NOT NULL,
                code TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        await db.commit()

async def save_snippet(id: str, language: str, code: str, created_at: str):
    async with aiosqlite.connect(DATABASE_URL) as db:
        await db.execute(
            "INSERT INTO snippets (id, language, code, created_at) VALUES (?, ?, ?, ?)",
            (id, language, code, created_at)
        )
        await db.commit()

async def get_snippet(id: str):
    async with aiosqlite.connect(DATABASE_URL) as db:
        async with db.execute(
            "SELECT id, language, code, created_at FROM snippets WHERE id = ?", (id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return {"id": row[0], "language": row[1], "code": row[2], "created_at": row[3]}
            return None
