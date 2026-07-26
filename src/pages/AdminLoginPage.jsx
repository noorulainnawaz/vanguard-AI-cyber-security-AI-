import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://vanguard-ai.fastapicloud.dev";

export default function AdminLoginPage({ onAdminLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      onAdminLogin(data.access_token);
      navigate("/system-access-portal/dashboard");
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Could not reach the server. Is the backend running?" : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-9">
        <h1 className="font-display text-2xl font-semibold mb-1">Admin Access</h1>
        <p className="text-slate text-sm mb-7">Authorized personnel only</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-soft mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              autoComplete="off"
              className="w-full border border-black/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-pale focus:border-emerald"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-charcoal-soft mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className="w-full border border-black/10 rounded-lg px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-pale focus:border-emerald"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate text-xs font-bold"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-emerald text-white font-bold py-3 rounded-lg disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Access Admin Panel"}
          </button>
        </form>

        <p className="text-center text-sm text-slate mt-6">
          <a href="/" className="text-slate hover:text-emerald">
            ← Back to home
          </a>
        </p>
      </div>
    </main>
  );
}