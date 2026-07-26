import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function IdentityRiskPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    user_id: 1,
    uses_2fa: false,
    password_reused: false,
    weak_password: false,
    public_email_exposed: false,
    old_password_days: 0,
    brand_impersonation_detected: false,
    similar_usernames_found: 0,
    responded_to_unsolicited_requests: false,
    shares_personal_info_publicly: false,
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
      const res = await fetch(`${API_URL}/identity-risk`, {
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
        <h1 className="font-display text-2xl text-charcoal mb-6">Digital Identity Risk Analysis</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-3">
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="uses_2fa" checked={form.uses_2fa} onChange={handleChange} /> 2FA Enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="password_reused" checked={form.password_reused} onChange={handleChange} /> Password Reused
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="weak_password" checked={form.weak_password} onChange={handleChange} /> Weak Password
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="public_email_exposed" checked={form.public_email_exposed} onChange={handleChange} /> Email Exposed Publicly
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="brand_impersonation_detected" checked={form.brand_impersonation_detected} onChange={handleChange} /> Brand Impersonation Detected
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="responded_to_unsolicited_requests" checked={form.responded_to_unsolicited_requests} onChange={handleChange} /> Responded to Unsolicited Requests
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input type="checkbox" name="shares_personal_info_publicly" checked={form.shares_personal_info_publicly} onChange={handleChange} /> Shares Personal Info Publicly
          </label>
          <div>
            <label className="block text-sm text-charcoal mb-1">Days Since Password Change</label>
            <input type="number" name="old_password_days" value={form.old_password_days} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Similar/Lookalike Usernames Found</label>
            <input type="number" name="similar_usernames_found" value={form.similar_usernames_found} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Analyzing..." : "Analyze Risk"}
          </button>
        </form>

        {result && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6 mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-display text-charcoal">{result.digital_identity_score}/100</span>
              <span className={`font-semibold ${riskColor(result.risk_level)}`}>{result.risk_level} Risk</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Brand Impersonation Risk</p>
                <p className="font-semibold text-charcoal">{result.brand_impersonation_risk}</p>
              </div>
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Username Similarity Count</p>
                <p className="font-semibold text-charcoal">{result.username_similarity_count}</p>
              </div>
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Email Exposure Risk</p>
                <p className={`font-semibold ${riskColor(result.email_exposure_risk?.level)}`}>
                  {result.email_exposure_risk?.score}/100 — {result.email_exposure_risk?.level}
                </p>
              </div>
              <div className="border border-emerald-pale rounded-xl p-3">
                <p className="text-xs text-slate">Social Engineering Risk</p>
                <p className={`font-semibold ${riskColor(result.social_engineering_risk?.level)}`}>
                  {result.social_engineering_risk?.score}/100 — {result.social_engineering_risk?.level}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-charcoal mb-2">Risk Factors</h3>
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