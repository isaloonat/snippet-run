from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic
import random
import string
from datetime import datetime

load_dotenv()

from piston import run_code
from db import init_db, save_snippet, get_snippet

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

class RunRequest(BaseModel):
    language: str
    code: str

class ShareRequest(BaseModel):
    language: str
    code: str

class ExplainRequest(BaseModel):
    language: str
    code: str

@app.post("/run")
async def run(req: RunRequest):
    result = await run_code(req.language, req.code)
    return result

@app.post("/share")
async def share(req: ShareRequest):
    id = "".join(random.choices(string.ascii_letters + string.digits, k=8))
    created_at = datetime.utcnow().isoformat()
    await save_snippet(id, req.language, req.code, created_at)
    return {"id": id}

@app.get("/share/{id}")
async def get_share(id: str):
    snippet = await get_snippet(id)
    if not snippet:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet

@app.post("/explain")
async def explain(req: ExplainRequest):
    import os
    from fastapi.responses import StreamingResponse
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def stream():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"Explain this {req.language} code concisely for a developer:\n\n```{req.language}\n{req.code}\n```"
            }]
        ) as s:
            for text in s.text_stream:
                yield text

    return StreamingResponse(stream(), media_type="text/plain")
