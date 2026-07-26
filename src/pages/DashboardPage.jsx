import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Sidebar from "../components/Sidebar";

const API_URL = "http://vanguard-ai.fastapicloud.dev";
const ORG_ID = 1;

export default function DashboardPage({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchDashboard() {
    try {
      const res = await fetch(`${API_URL}/dashboard/${ORG_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex bg-bg min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Identity", score: data?.identity_risk?.score ?? 0 },
    { name: "Human", score: data?.human_risk?.score ?? 0 },
    { name: "Insider", score: data?.insider_threat?.score ?? 0 },
  ];

  const riskColor = (score) =>
    score >= 60 ? "text-red-500 bg-red-50" : score >= 25 ? "text-gold bg-gold-soft/20" : "text-emerald bg-emerald-pale";

  const priorityColor = (p) =>
    p === "High" ? "border-red-400" : p === "Medium" ? "border-gold" : "border-emerald";

  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display text-2xl text-charcoal">Mission Control Dashboard</h1>
          <button
            onClick={() => { onLogout && onLogout(); navigate("/login"); }}
            className="bg-charcoal text-white px-4 py-2 rounded-xl text-sm hover:bg-charcoal-soft transition"
          >
            Logout
          </button>
        </div>

        {/* Overall Risk Score */}
        <div className="bg-gradient-to-r from-emerald to-emerald-light rounded-2xl p-6 text-white mb-6">
          <p className="text-xs uppercase tracking-wide opacity-80">Overall Risk Score</p>
          <p className="text-5xl font-display mt-1">{data?.overall_risk_score ?? "N/A"}</p>
        </div>

        {/* Risk Score Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-2xl p-5 ${riskColor(data?.identity_risk?.score ?? 0)}`}>
            <p className="text-xs uppercase font-medium">Identity Risk</p>
            <p className="text-3xl font-display mt-1">{data?.identity_risk?.score ?? "N/A"}</p>
          </div>
          <div className={`rounded-2xl p-5 ${riskColor(data?.human_risk?.score ?? 0)}`}>
            <p className="text-xs uppercase font-medium">Human Risk</p>
            <p className="text-3xl font-display mt-1">{data?.human_risk?.score ?? "N/A"}</p>
          </div>
          <div className={`rounded-2xl p-5 ${data?.insider_threat ? riskColor(data.insider_threat.score) : "text-slate bg-white border border-emerald-pale"}`}>
            <p className="text-xs uppercase font-medium">Insider Threat</p>
            <p className="text-3xl font-display mt-1">{data?.insider_threat?.score ?? "N/A"}</p>
            {!data?.insider_threat && <p className="text-xs mt-1">No data yet</p>}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-emerald-pale rounded-2xl p-6 mb-6">
          <h3 className="font-display text-lg text-charcoal mb-4">Risk Score Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7F3ED" />
              <XAxis dataKey="name" stroke="#667169" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#667169" fontSize={12} />
              <Tooltip />
              <Bar dataKey="score" fill="#0E6E4E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent Attack Stories */}
          <div className="bg-white border border-emerald-pale rounded-2xl p-6">
            <h3 className="font-display text-lg text-charcoal mb-3">Recent Attack Stories</h3>
            {data?.recent_attack_stories?.length ? (
              <ul className="space-y-2">
                {data.recent_attack_stories.map((s) => (
                  <li key={s.id} className="text-sm text-slate border-b border-emerald-pale/50 pb-2">
                    {s.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate">No attack stories yet.</p>
            )}
          </div>

          {/* Recent AI Decisions */}
          <div className="bg-white border border-emerald-pale rounded-2xl p-6">
            <h3 className="font-display text-lg text-charcoal mb-3">Recent AI Decisions</h3>
            {data?.recent_ai_decisions?.length ? (
              <div className="space-y-2">
                {data.recent_ai_decisions.map((d) => (
                  <div key={d.id} className={`border-l-4 pl-3 py-1 ${priorityColor(d.priority)}`}>
                    <p className="text-xs text-slate">{d.category} — {d.priority} Priority</p>
                    <p className="text-sm text-charcoal">{d.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate">No AI decisions yet.</p>
            )}
          </div>
        </div>

        {/* Security Timeline */}
        <div className="bg-white border border-emerald-pale rounded-2xl p-6 mt-6">
          <h3 className="font-display text-lg text-charcoal mb-4">Security Timeline</h3>
          {data?.security_timeline?.length ? (
            <div className="relative border-l-2 border-emerald-pale pl-6 space-y-4">
              {data.security_timeline.map((e, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald" />
                  <p className="text-sm text-charcoal font-medium">{e.type}</p>
                  <p className="text-xs text-slate">{e.timestamp ? new Date(e.timestamp).toLocaleString() : ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">No timeline events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}