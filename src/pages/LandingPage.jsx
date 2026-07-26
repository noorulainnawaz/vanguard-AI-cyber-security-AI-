import { Link } from "react-router-dom";

const features = [
  { title: "AI-powered risk scoring", desc: "Identity, human, and insider threat risk scored automatically by local AI models." },
  { title: "Attack simulation engine", desc: "Generate realistic attack scenarios and timelines to train your team." },
  { title: "Conversational security assistant", desc: "Ask the AI chat interface direct questions about your organization's posture." },
  { title: "Enterprise-grade security", desc: "Bcrypt hashing, JWT sessions, and protected APIs guard every request." },
];

const steps = [
  { num: "01", title: "Connect your org", desc: "Register your organization and bring your team on board." },
  { num: "02", title: "Feed in signals", desc: "Submit identity, behavior, and activity data to the platform." },
  { num: "03", title: "AI analyzes risk", desc: "The engine scores risk and generates tailored recommendations." },
  { num: "04", title: "Act on insight", desc: "Review the dashboard, export reports, and close the gaps." },
];

export default function LandingPage({ token }) {
  return (
    <main>
      <nav className="sticky top-0 z-50 backdrop-blur bg-bg/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-semibold text-xl">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald to-emerald-light" />
            Vanguard AI
          </div>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-charcoal-soft">
            <a href="#features" className="hover:text-emerald">Features</a>
            <a href="#how" className="hover:text-emerald">How it works</a>
            <a href="#about" className="hover:text-emerald">About</a>
            <a href="#contact" className="hover:text-emerald">Contact</a>
          </div>
          <div className="flex gap-3">
            {token ? (
              <Link to="/dashboard" className="px-5 py-2.5 rounded-lg bg-emerald text-white font-bold text-sm shadow-lg shadow-emerald/25 hover:-translate-y-0.5 transition">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 rounded-lg border border-black/10 font-bold text-sm hover:border-emerald hover:text-emerald transition">Log in</Link>
                <Link to="/register" className="px-5 py-2.5 rounded-lg bg-emerald text-white font-bold text-sm shadow-lg shadow-emerald/25 hover:-translate-y-0.5 transition">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-8 pt-24 pb-16 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-emerald-pale text-emerald font-bold text-xs uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" /> AI-powered cybersecurity decisions
          </span>
          <h1 className="font-display text-5xl leading-tight font-semibold">
            Turn security signals into <span className="text-emerald">decisions</span>, automatically.
          </h1>
          <p className="mt-6 text-lg text-slate max-w-lg leading-relaxed">
            Vanguard AI scores identity, human, and insider risk in real time — then tells your team exactly what to fix first.
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/register" className="px-7 py-3.5 rounded-lg bg-emerald text-white font-bold shadow-lg shadow-emerald/25 hover:-translate-y-0.5 transition">Create free account</Link>
            <Link to="/login" className="px-7 py-3.5 rounded-lg border border-black/10 font-bold hover:border-emerald hover:text-emerald transition">Log in</Link>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-2xl p-8">
          <div className="text-xs font-bold uppercase tracking-wide text-slate mb-4">Live risk pipeline</div>
          {["Signals collected", "AI models score risk", "Report & fixes ready"].map((label, i) => (
            <div key={label}>
              <div className="flex items-center gap-3 bg-white border border-black/5 rounded-xl px-4 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-emerald-pale flex items-center justify-center font-bold text-emerald">{i + 1}</div>
                <span className="font-semibold text-sm">{label}</span>
              </div>
              {i < 2 && <div className="w-0.5 h-6 mx-8 border-l-2 border-dashed border-gold" />}
            </div>
          ))}
        </div>
      </header>

      <section id="features" className="bg-white py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-12">
            <span className="text-emerald font-bold text-xs uppercase tracking-wide">Platform</span>
            <h2 className="font-display text-4xl font-semibold mt-3">Everything your security team needs</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-bg border border-black/5 rounded-2xl p-6 hover:-translate-y-1.5 hover:shadow-xl transition">
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-charcoal text-white py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-14">
            <span className="text-gold font-bold text-xs uppercase tracking-wide">Process</span>
            <h2 className="font-display text-4xl font-semibold mt-3">From signal to safeguard in four steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num}>
                <span className="font-display text-gold font-semibold">{s.num}</span>
                <h3 className="font-bold mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-24 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="bg-gradient-to-br from-emerald to-[#0A5A40] text-white rounded-3xl p-10 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-gold text-charcoal flex items-center justify-center font-display font-bold text-lg mb-4">VA</div>
            <h4 className="text-xl font-semibold">Vanguard AI</h4>
            <div className="text-gold-soft text-xs font-bold uppercase tracking-wide mb-4">Cybersecurity Decision Platform</div>
            <p className="text-sm text-white/85 leading-relaxed">Vanguard AI was built to make enterprise-grade security risk analysis accessible without a dedicated analyst team on staff.</p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold mb-5">Built to make security decisions effortless</h2>
            <p className="text-slate leading-relaxed mb-4">Vanguard AI closes the gap between raw security signals and the people who need to act on them — no manual scoring, no guesswork.</p>
            <p className="text-slate leading-relaxed">The platform wraps AI-driven analysis in a clean, secure interface: submit signals, get scored risk, and receive clear next steps.</p>
            <div className="flex gap-5 mt-7">
              <div className="border-l-2 border-gold pl-3.5"><b className="block text-sm">Vision</b><span className="text-xs text-slate">Make enterprise security usable by any team.</span></div>
              <div className="border-l-2 border-gold pl-3.5"><b className="block text-sm">Mission</b><span className="text-xs text-slate">Turn raw signals into actionable defense.</span></div>
              <div className="border-l-2 border-gold pl-3.5"><b className="block text-sm">Purpose</b><span className="text-xs text-slate">Remove friction between risk and response.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-bg py-24 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <span className="text-emerald font-bold text-xs uppercase tracking-wide">Get in touch</span>
            <h2 className="font-display text-3xl font-semibold mt-3 mb-6">Questions about the platform?</h2>
            <p className="text-slate">Email: <strong>noornawaz6776@gmail.com</strong></p>
          </div>
          <form className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm space-y-4">
            <input className="w-full border border-black/10 rounded-lg px-4 py-3 text-sm" placeholder="Your name" />
            <input className="w-full border border-black/10 rounded-lg px-4 py-3 text-sm" placeholder="Email" type="email" />
            <textarea className="w-full border border-black/10 rounded-lg px-4 py-3 text-sm min-h-[100px]" placeholder="Message" />
            <button type="button" className="w-full bg-emerald text-white font-bold py-3 rounded-lg">Send message</button>
          </form>
        </div>
      </section>

      <footer className="bg-charcoal text-white/60 py-14 px-8 text-sm">
        <div className="max-w-6xl mx-auto flex justify-between flex-wrap gap-6">
          <span>© 2026 Vanguard AI. All rights reserved.</span>
          <span>Enterprise Cybersecurity Decision Platform</span>
        </div>
      </footer>
    </main>
  );
}