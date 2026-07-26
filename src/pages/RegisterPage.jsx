import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

const API_URL = "https://vanguard-ai.fastapicloud.dev";

export default function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", username: "", email: "", phone: "", cnic: "", password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, org_id: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      onLogin(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-black/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-pale focus:border-emerald";
  const labelClass = "block text-xs font-bold text-charcoal-soft mb-1.5";

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-9">
        <h1 className="font-display text-2xl font-semibold mb-1">Create your account</h1>
        <p className="text-slate text-sm mb-7">Join Vanguard AI to start monitoring risk</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input className={inputClass} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Username</label>
            <input className={inputClass} value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Phone number</label>
            <input type="tel" className={inputClass} value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>CNIC</label>
            <input className={inputClass} placeholder="XXXXX-XXXXXXX-X" value={form.cnic}
              onChange={(e) => setForm({ ...form, cnic: e.target.value })} required />
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={inputClass} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <PasswordStrengthMeter password={form.password} />
          </div>

          <div>
            <label className={labelClass}>Confirm password</label>
            <input type="password" className={inputClass} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <button disabled={loading} className="w-full bg-emerald text-white font-bold py-3 rounded-lg disabled:opacity-60">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate mt-6">
          Already have an account? <Link to="/login" className="text-emerald font-bold">Log in</Link>
        </p>
        <p className="text-center text-sm text-slate mt-2">
          <Link to="/" className="text-slate hover:text-emerald">← Back to home</Link>
        </p>
      </div>
    </main>
  );
}