import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function FileAnalysisPage() {
  const token = localStorage.getItem("token");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/analyze-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s) =>
    s === "High" ? "border-red-400 bg-red-50" :
      s === "Medium" ? "border-gold bg-gold-soft/20" : "border-emerald bg-emerald-pale/40";

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">AI File Security Analysis</h1>
        <p className="text-sm text-slate mb-4">Supported: .txt, .log, .csv, .json, .py, .js, .yaml, .yml, .conf, .ini, .md</p>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4 mb-6">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
          <button type="submit" disabled={loading || !file}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Analyzing..." : "Analyze File"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        {result && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4">
            <h3 className="font-display text-lg text-charcoal">{result.filename}</h3>
            <p className="text-sm text-slate">{result.summary}</p>
            <p className="text-sm">Overall Risk: <span className="font-semibold text-gold">{result.overall_risk}</span></p>

            <div className="space-y-2">
              {result.findings?.map((f, i) => (
                <div key={i} className={`border rounded-xl p-3 ${severityColor(f.severity)}`}>
                  <p className="text-xs font-semibold text-charcoal">{f.severity} Severity</p>
                  <p className="text-sm text-charcoal">{f.issue}</p>
                  <p className="text-xs text-slate mt-1">Fix: {f.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}