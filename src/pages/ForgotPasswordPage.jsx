import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";

const API_URL = "https://vanguard-ai.fastapicloud.dev";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset-password-cnic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cnic, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-black/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-pale focus:border-emerald";

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-9">
        <h1 className="font-display text-2xl font-semibold mb-1">Reset password</h1>
        <p className="text-slate text-sm mb-7">Verify your identity with your email and CNIC</p>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
        {success && <div className="bg-emerald-pale text-emerald text-sm rounded-lg px-4 py-3 mb-5">Password reset! Redirecting to login...</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" required placeholder="Registered email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <input required placeholder="CNIC (XXXXX-XXXXXXX-X)" value={cnic}
              onChange={(e) => setCnic(e.target.value)} className={inputClass} />
            <div>
              <input type="password" required placeholder="New password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            <input type="password" required placeholder="Confirm new password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
            <button disabled={loading} className="w-full bg-emerald text-white font-bold py-3 rounded-lg disabled:opacity-60">
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate mt-6">
          <Link to="/login" className="text-emerald font-bold">← Back to login</Link>
        </p>
      </div>
    </main>
  );
}