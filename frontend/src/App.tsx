import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { runCode, shareCode, getSnippet, explainCode } from "./api";

const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "c", label: "C" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "bash", label: "Bash" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
];

const DEFAULTS: Record<string, string> = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!");',
  typescript: 'const msg: string = "Hello, World!";\nconsole.log(msg);',
  c: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  bash: 'echo "Hello, World!"',
  go: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
  rust: 'fn main() {\n    println!("Hello, World!");\n}',
};

export default function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULTS["python"]);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exit_code: number } | null>(null);
  const [explanation, setExplanation] = useState("");
  const [tab, setTab] = useState<"output" | "explain">("output");
  const [running, setRunning] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // const params = new URLSearchParams(window.location.search);
    const id = window.location.pathname.split("/s/")[1];
    if (id) {
      getSnippet(id).then((s) => {
        if (s?.code) {
          setLanguage(s.language);
          setCode(s.code);
        }
      });
    }
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    setTab("output");
    const result = await runCode(language, code);
    setOutput(result);
    setRunning(false);
  };

  const handleShare = async () => {
    setSharing(true);
    const result = await shareCode(language, code);
    const url = `${window.location.origin}/s/${result.id}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    setSharing(false);
  };

  const handleExplain = async () => {
    setExplaining(true);
    setExplanation("");
    setTab("explain");
    await explainCode(language, code, (chunk) => {
      setExplanation((prev) => prev + chunk);
    });
    setExplaining(false);
  };

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", color: "#f0f0f0", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#161616", borderBottom: "1px solid #2a2a2a", padding: "0 24px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px" }}>
          snippet<span style={{ color: "#7c3aed" }}>.run</span>
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setCode(DEFAULTS[e.target.value]); }}
            style={{ background: "#1e1e1e", color: "#f0f0f0", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "6px 10px", fontSize: "13px", cursor: "pointer" }}
          >
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button
            onClick={handleRun}
            disabled={running}
            style={{ background: pulse ? "#6d28d9" : "#7c3aed", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
          >
            {running ? "Running..." : "? Run"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            style={{ background: "#1e1e1e", color: "#f0f0f0", border: "1px solid #2a2a2a", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", cursor: "pointer" }}
          >
            {sharing ? "Sharing..." : "Share"}
          </button>
          <button
            onClick={handleExplain}
            disabled={explaining}
            style={{ background: "#1e1e1e", color: "#7c3aed", border: "1px solid #7c3aed", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", cursor: "pointer" }}
          >
            {explaining ? "Explaining..." : "Explain"}
          </button>
        </div>
      </div>

      {shareUrl && (
        <div style={{ background: "#1a1a2e", borderBottom: "1px solid #2a2a2a", padding: "8px 24px", fontSize: "13px", color: "#7c3aed" }}>
          ? Copied: <span style={{ color: "#f0f0f0" }}>{shareUrl}</span>
        </div>
      )}

      {/* Main */}
      <div style={{ display: "flex", height: "calc(100vh - 52px)" }}>
        {/* Editor */}
        <div style={{ flex: 1, borderRight: "1px solid #2a2a2a" }}>
          <Editor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
            options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 }, scrollBeyondLastLine: false }}
          />
        </div>

        {/* Output Panel */}
        <div style={{ width: "40%", display: "flex", flexDirection: "column", background: "#161616" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a" }}>
            {["output", "explain"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as "output" | "explain")}
                style={{ flex: 1, padding: "10px", background: tab === t ? "#1e1e1e" : "transparent", color: tab === t ? "#f0f0f0" : "#666", border: "none", borderBottom: tab === t ? "2px solid #7c3aed" : "2px solid transparent", cursor: "pointer", fontSize: "13px", textTransform: "capitalize" }}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, padding: "16px", fontFamily: "JetBrains Mono, monospace", fontSize: "13px", overflowY: "auto" }}>
            {tab === "output" ? (
              output ? (
                <>
                  {output.stdout && <pre style={{ color: "#22c55e", margin: 0, whiteSpace: "pre-wrap" }}>{output.stdout}</pre>}
                  {output.stderr && <pre style={{ color: "#ef4444", margin: 0, whiteSpace: "pre-wrap" }}>{output.stderr}</pre>}
                  <div style={{ color: output.exit_code === 0 ? "#22c55e" : "#ef4444", marginTop: "8px", fontSize: "12px" }}>
                    exit code: {output.exit_code}
                  </div>
                </>
              ) : (
                <span style={{ color: "#666" }}>Run your code to see output.</span>
              )
            ) : (
              explanation ? (
                <pre style={{ color: "#f0f0f0", margin: 0, whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif" }}>{explanation}</pre>
              ) : (
                <span style={{ color: "#666" }}>{explaining ? "Explaining..." : "Click Explain to analyse your code."}</span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
