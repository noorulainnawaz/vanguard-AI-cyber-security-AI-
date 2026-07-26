export default function PasswordStrengthMeter({ password }) {
  const checks = [
    { label: "At least 8 characters", test: password.length >= 8 },
    { label: "One uppercase letter", test: /[A-Z]/.test(password) },
    { label: "One lowercase letter", test: /[a-z]/.test(password) },
    { label: "One number", test: /[0-9]/.test(password) },
    { label: "One symbol (!@#$...)", test: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.test).length;
  const strength = passedCount <= 2 ? "Weak" : passedCount <= 4 ? "Medium" : "Strong";
  const barColor = strength === "Weak" ? "bg-red-500" : strength === "Medium" ? "bg-gold" : "bg-emerald";
  const widthPercent = (passedCount / checks.length) * 100;

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${widthPercent}%` }} />
      </div>
      <p className="text-xs mt-1 font-medium text-charcoal-soft">{strength} password</p>
      <ul className="mt-1 space-y-0.5">
        {checks.map((c, i) => (
          <li key={i} className={`text-xs flex items-center gap-1 ${c.test ? "text-emerald" : "text-slate"}`}>
            <span>{c.test ? "✓" : "○"}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}