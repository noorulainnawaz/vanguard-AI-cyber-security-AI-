import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function HumanRiskPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    user_id: 1,
    phishing_click_rate: 0,
    security_training_completed: false,
    reported_suspicious_emails: 0,
    shares_credentials: false,
    clicked_unknown_links_count: 0,
    uses_password_manager: false,
    reuses_passwords_across_sites: false,
    mfa_enabled_everywhere: false,
    follows_security_policies: false,
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
      const res = await fetch(`${API_URL}/human-risk`, {
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
    level === "High" || level === "Poor" || level === "Basic" ? "text-red-500" :
      level === "Medium" || level === "Fair" || level === "Developing" ? "text-gold" : "text-emerald";

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 max-w-2xl">
        <h1 className="font-display text-2xl text-charcoal mb-6">Human Risk Engine</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-3">
          <div>
            <label className="block text-sm text-charcoal mb-1">Phishing Click Rate (0.0 - 1.0)</label>
            <input type="number" step="0.01" min="0" max="1" name="phishing_click_rate" value={form.phishing_click_rate} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="security_training_completed" checked={form.security_training_completed} onChange={handleChange} /> Security Training Completed
          </label>
          <div>
            <label className="block text-sm text-charcoal mb-1">Suspicious Emails Reported</label>
            <input type="number" name="reported_suspicious_emails" value={form.reported_suspicious_emails} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="shares_credentials" checked={form.shares_credentials} onChange={handleChange} /> Shares Credentials
          </label>
          <div>
            <label className="block text-sm text-charcoal mb-1">Unknown Links Clicked</label>
            <input type="number" name="clicked_unknown_links_count" value={form.clicked_unknown_links_count} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="uses_password_manager" checked={form.uses_password_manager} onChange={handleChange} /> Uses Password Manager
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="reuses_passwords_across_sites" checked={form.reuses_passwords_across_sites} onChange={handleChange} /> Reuses Passwords Across Sites
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="mfa_enabled_everywhere" checked={form.mfa_enabled_everywhere} onChange={handleChange} /> MFA Enabled Everywhere
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="follows_security_policies" checked={form.follows_security_policies} onChange={handleChange} /> Follows Security Policies
          </label>

          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Analyzing..." : "Assess Risk"}
          </button>
        </form>

        {result && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display text-charcoal">{result.human_risk_score}/100</span>
              <span className={`font-semibold ${riskColor(result.risk_level)}`}>{result.risk_level} Risk</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Phishing Awareness</p>
                <p className="font-semibold text-charcoal">{result.phishing_awareness_score}/100</p>
              </div>
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Password Hygiene</p>
                <p className={`font-semibold ${riskColor(result.password_hygiene?.level)}`}>
                  {result.password_hygiene?.score}/100 — {result.password_hygiene?.level}
                </p>
              </div>
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Security Maturity</p>
                <p className={`font-semibold ${riskColor(result.security_maturity?.level)}`}>
                  {result.security_maturity?.score}/100 — {result.security_maturity?.level}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Behavioral Factors</h3>
              <ul className="list-disc list-inside text-sm text-slate">
                {result.factors?.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">AI Recommendations</h3>
              <p className="text-sm text-slate whitespace-pre-wrap">{result.ai_recommendations}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}