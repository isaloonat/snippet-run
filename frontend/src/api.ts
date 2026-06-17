const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function runCode(language: string, code: string) {
  const res = await fetch(`${API_BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });
  return res.json();
}

export async function shareCode(language: string, code: string) {
  const res = await fetch(`${API_BASE}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });
  return res.json();
}

export async function getSnippet(id: string) {
  const res = await fetch(`${API_BASE}/share/${id}`);
  return res.json();
}

export async function explainCode(
  language: string,
  code: string,
  onChunk: (text: string) => void
) {
  const res = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}
