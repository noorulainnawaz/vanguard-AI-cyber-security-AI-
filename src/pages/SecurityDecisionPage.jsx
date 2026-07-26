import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function SecurityDecisionPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    org_id: 1,
    industry: "Technology",
    company_size: "Medium",
    current_tools: "Firewall, Antivirus",
    budget: "Medium",
    number_of_employees: 50,
    current_security_level: "Basic",
  });
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, type, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setDecision(null);
    try {
      const res = await fetch(`${API_URL}/security-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setDecision(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const priorityColor = (p) =>
    p === "High" ? "border-red-400 bg-red-50" :
      p === "Medium" ? "border-gold bg-gold-soft/20" : "border-emerald bg-emerald-pale/40";

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">AI Security Decision Engine</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm text-charcoal mb-1">Industry</label>
            <input type="text" name="industry" value={form.industry} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Company Size</label>
            <select name="company_size" value={form.company_size} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>Small</option><option>Medium</option><option>Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Number of Employees</label>
            <input type="number" name="number_of_employees" value={form.number_of_employees} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Current Security Level</label>
            <select name="current_security_level" value={form.current_security_level} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>None</option><option>Basic</option><option>Intermediate</option><option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Current Security Tools (comma separated)</label>
            <input type="text" name="current_tools" value={form.current_tools} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Budget Level</label>
            <select name="budget" value={form.budget} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>Low</option><option>Medium</option><option>High</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Generating Roadmap..." : "Generate Security Roadmap"}
          </button>
        </form>

        {decision && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Overall Assessment</h3>
              <p className="text-sm text-slate">{decision.overall_assessment}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Risk Assessment</h3>
              <p className="text-sm text-slate">{decision.risk_assessment}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Prioritized Recommendations</h3>
              <div className="space-y-3">
                {decision.recommendations?.map((r, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${priorityColor(r.priority)}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-charcoal">{r.category}</span>
                      <span className="text-xs font-semibold">{r.priority} Priority</span>
                    </div>
                    <p className="text-sm text-charcoal font-medium">{r.recommendation}</p>
                    <p className="text-xs text-slate mt-1">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Implementation Phases</h3>
              <div className="space-y-3">
                {decision.implementation_phases?.map((p, i) => (
                  <div key={i} className="border border-emerald-pale rounded-xl p-4">
                    <p className="text-sm font-semibold text-emerald">{p.phase}</p>
                    <p className="text-sm text-charcoal mb-1">{p.focus}</p>
                    <ul className="list-disc list-inside text-xs text-slate">
                      {p.actions?.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-3">Budget Allocation</h3>
              <div className="space-y-2">
                {decision.budget_allocation?.map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-charcoal mb-1">
                      <span>{b.category}</span><span>{b.percentage}%</span>
                    </div>
                    <div className="w-full bg-emerald-pale rounded-full h-2">
                      <div className="bg-emerald h-2 rounded-full" style={{ width: `${b.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Security Architecture Suggestions</h3>
              <ul className="list-disc list-inside text-sm text-slate">
                {decision.security_architecture_suggestions?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-1">Estimated Timeline</h3>
              <p className="text-sm text-slate">{decision.estimated_timeline}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}