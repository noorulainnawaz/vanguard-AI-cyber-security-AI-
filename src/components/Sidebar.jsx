import { Link, useLocation } from "react-router-dom";

const links = [
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
  { to: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <div className="w-60 min-h-screen bg-charcoal text-white p-5 flex flex-col gap-1">
      <h1 className="font-display text-xl text-gold mb-6">Vanguard AI</h1>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`px-3 py-2 rounded-lg text-sm transition ${
            location.pathname === link.to
              ? "bg-emerald text-white"
              : "text-slate hover:bg-charcoal-soft hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}