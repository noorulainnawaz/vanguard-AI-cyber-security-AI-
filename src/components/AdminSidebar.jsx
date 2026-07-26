import { Link, useLocation, useNavigate } from "react-router-dom";

const adminLinks = [
  { to: "/system-access-portal/dashboard", label: "Admin Overview" },
];

const aiToolLinks = [
  { to: "/dashboard", label: "Mission Control" },
  { to: "/chat", label: "AI Chat" },
  { to: "/identity-risk", label: "Identity Risk" },
  { to: "/human-risk", label: "Human Risk" },
  { to: "/insider-threat", label: "Insider Threat" },
  { to: "/attack-story", label: "Attack Story" },
  { to: "/cyber-lab", label: "Cyber Lab" },
  { to: "/security-decision", label: "Security Decision" },
  { to: "/attack-surface", label: "Attack Surface" },
  { to: "/file-analysis", label: "File Analysis" },
  { to: "/reports", label: "Reports" },
];

export default function AdminSidebar({ activeTab, onTabChange, onAdminLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    onAdminLogout();
    navigate("/system-access-portal");
  }

  return (
    <div className="w-60 min-h-screen bg-charcoal text-white p-5 flex flex-col gap-1">
      <h1 className="font-display text-xl text-gold mb-6">Vanguard AI</h1>

      <p className="text-[10px] uppercase tracking-wide text-white/40 font-bold mb-1 mt-1">
        Admin Panel
      </p>
      {["overview", "users", "orgs"].map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className={`text-left px-3 py-2 rounded-lg text-sm capitalize transition ${
            location.pathname === "/system-access-portal/dashboard" && activeTab === t
              ? "bg-emerald text-white font-semibold"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          {t === "overview" ? "Overview" : t === "users" ? "Manage Users" : "Organizations"}
        </button>
      ))}

      <p className="text-[10px] uppercase tracking-wide text-white/40 font-bold mb-1 mt-5">
        AI Tools (Full Access)
      </p>
      {aiToolLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === link.to
              ? "bg-emerald text-white font-semibold"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}

      <button
        onClick={handleLogout}
        className="mt-auto px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 text-left font-bold"
      >
        Log out
      </button>
    </div>
  );
}