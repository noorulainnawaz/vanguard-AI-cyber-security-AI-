import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function CyberLabPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({ topic: "SQL Injection", difficulty: "Beginner" });
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setLab(null);
    try {
      const res = await fetch(`${API_URL}/cyber-lab`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setLab(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">AI Cyber Lab Designer</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm text-charcoal mb-1">Topic</label>
            <input type="text" name="topic" value={form.topic} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. SQL Injection, XSS, Malware, Cryptography, OWASP" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Generating Lab..." : "Generate Lab"}
          </button>
        </form>

        {lab && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-5">
            <h2 className="font-display text-xl text-charcoal">{lab.title}</h2>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Learning Path</h3>
              <ol className="list-decimal list-inside text-sm text-slate">
                {lab.learning_path?.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Objectives</h3>
              <ul className="list-disc list-inside text-sm text-slate">
                {lab.objectives?.map((o, i) => <li key={i}>{o}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Explanation</h3>
              <p className="text-sm text-slate">{lab.explanation}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Hands-On Exercise</h3>
              <p className="text-sm text-slate bg-emerald-pale/40 p-3 rounded-lg">{lab.hands_on_exercise}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Expected Outcome</h3>
              <p className="text-sm text-slate">{lab.expected_outcome}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Quiz</h3>
              <div className="space-y-4">
                {lab.quiz?.map((q, i) => (
                  <div key={i} className="text-sm">
                    <p className="text-charcoal font-medium mb-1">{i + 1}. {q.question}</p>
                    <ul className="list-disc list-inside text-slate">
                      {q.options?.map((opt, j) => <li key={j}>{opt}</li>)}
                    </ul>
                    <p className="text-emerald text-xs mt-1">Correct: {q.correct_answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {lab.recommendations?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-charcoal mb-2">Recommendations</h3>
                <ul className="list-disc list-inside text-sm text-slate">
                  {lab.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}