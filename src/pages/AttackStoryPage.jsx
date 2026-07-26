import { useState } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";

export default function AttackStoryPage() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({ org_id: 1, industry: "Healthcare", attack_type: "Ransomware", company_size: "Medium" });
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStory(null);
    try {
      const res = await fetch(`${API_URL}/attack-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setStory(await res.json());
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
        <h1 className="font-display text-2xl text-charcoal mb-6">AI Attack Story Generator</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-emerald-pale rounded-2xl p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm text-charcoal mb-1">Industry</label>
            <input type="text" name="industry" value={form.industry} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Attack Type</label>
            <select name="attack_type" value={form.attack_type} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>Ransomware</option>
              <option>Phishing</option>
              <option>Credential Theft</option>
              <option>Business Email Compromise</option>
              <option>DDoS</option>
              <option>Insider Attack</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-charcoal mb-1">Company Size</label>
            <select name="company_size" value={form.company_size} onChange={handleChange}
              className="w-full border border-emerald-pale rounded-lg px-3 py-2 text-sm">
              <option>Small</option>
              <option>Medium</option>
              <option>Enterprise</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="bg-emerald text-white px-5 py-2 rounded-xl font-medium hover:bg-emerald-light transition disabled:opacity-50">
            {loading ? "Generating..." : "Generate Attack Story"}
          </button>
        </form>

        {story && (
          <div className="bg-white border border-emerald-pale rounded-2xl p-6">
            <h2 className="font-display text-xl text-charcoal mb-2">{story.title}</h2>
            <p className="text-sm text-slate mb-6">{story.summary}</p>

            <div className="relative border-l-2 border-emerald-pale pl-6 space-y-6">
              {story.timeline?.map((stage, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald" />
                  <h3 className="text-sm font-semibold text-emerald">{stage.stage}</h3>
                  <p className="text-sm text-slate">{stage.description}</p>
                </div>
              ))}
            </div>

            {story.lessons_learned?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-charcoal mb-2">Lessons Learned</h3>
                <ul className="list-disc list-inside text-sm text-slate">
                  {story.lessons_learned.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}