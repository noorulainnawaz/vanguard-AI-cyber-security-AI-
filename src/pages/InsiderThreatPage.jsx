import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function InsiderThreatPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    user_id: 1,
    employee_name: "",
    after_hours_logins: 0,
    bulk_downloads: 0,
    failed_login_attempts: 0,
    accessed_unauthorized_files: false,
    used_personal_usb: false,
    resigned_or_notice_period: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/insider-threat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setResult(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const riskColor = (level) =>
    level === "High" ? "text-red-500" : level === "Medium" ? "text-gold" : "text-emerald";

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-2xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">Insider Threat Predictor</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-3">
          <div>
            <label className="block text-sm text-charcoal mb-1">Employee Name</label>
            <input type="text" name="employee_name" value={form.employee_name} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">After-Hours Logins</label>
            <input type="number" name="after_hours_logins" value={form.after_hours_logins} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Bulk File Downloads</label>
            <input type="number" name="bulk_downloads" value={form.bulk_downloads} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Failed Login Attempts</label>
            <input type="number" name="failed_login_attempts" value={form.failed_login_attempts} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="accessed_unauthorized_files" checked={form.accessed_unauthorized_files} onChange={handleChange} /> Accessed Unauthorized Files
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="used_personal_usb" checked={form.used_personal_usb} onChange={handleChange} /> Used Personal USB
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="resigned_or_notice_period" checked={form.resigned_or_notice_period} onChange={handleChange} /> In Notice Period / Resigned
          </label>

          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Analyzing..." : "Run Prediction"}
          </button>
        </form>

        {result && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display text-charcoal">{result.insider_threat_score}/100</span>
              <span className={`font-semibold ${riskColor(result.risk_level)}`}>{result.risk_level} Risk</span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Indicators</h3>
              <ul className="list-disc list-inside text-sm text-slate">
                {result.indicators?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Suspicious Behaviour Timeline</h3>
              <div className="relative border-l-2 border-emerald-pale pl-5 space-y-3">
                {result.suspicious_behaviour_timeline?.map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-emerald" />
                    <p className="text-sm font-medium text-charcoal">{t.event}</p>
                    <p className="text-xs text-slate">{t.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">AI Assessment</h3>
              <p className="text-sm text-slate whitespace-pre-wrap">{result.ai_assessment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}