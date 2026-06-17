import httpx
import os

JUDGE0_API = "https://ce.judge0.com"

LANGUAGE_IDS = {
    "python": 71,
    "javascript": 63,
    "typescript": 74,
    "c": 50,
    "cpp": 54,
    "java": 62,
    "bash": 46,
    "go": 60,
    "rust": 73,
}

async def run_code(language: str, code: str) -> dict:
    lang_id = LANGUAGE_IDS.get(language, 71)
    import base64
    encoded = base64.b64encode(code.encode()).decode()
    async with httpx.AsyncClient(timeout=30) as client:
        sub = await client.post(
            f"{JUDGE0_API}/submissions?base64_encoded=true&wait=true",
            json={"language_id": lang_id, "source_code": encoded},
            headers={"Content-Type": "application/json"}
        )
        result = sub.json()
        import base64 as b64
        stdout = b64.b64decode(result.get("stdout") or "").decode() if result.get("stdout") else ""
        stderr = b64.b64decode(result.get("stderr") or "").decode() if result.get("stderr") else ""
        compile_err = b64.b64decode(result.get("compile_output") or "").decode() if result.get("compile_output") else ""
        return {
            "stdout": stdout,
            "stderr": stderr or compile_err,
            "exit_code": result.get("exit_code") or 0,
        }
