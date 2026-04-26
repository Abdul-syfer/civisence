import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Camera, Users, Bell, Shield, BarChart3, Zap, Check,
  ArrowRight, Sparkles, MessageCircle, TrendingUp,
} from "lucide-react";
import { PhoneDemo } from "@/components/civic/PhoneDemo";
import civicLogo from "@/assets/civic-logo.png";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <Stats />
      <Marquee />
      <Features />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </main>
  );
}

function Nav() {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/70 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="relative w-9 h-9 grid place-items-center">
            <img src={civicLogo} alt="CivicSense logo" className="w-full h-full object-contain" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: "var(--civic-green)" }} />
          </div>
          <span className="font-display font-bold text-lg">
            Civic<span style={{ color: "var(--civic-blue)" }}>Sense</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-civic-blue transition-colors">Features</a>
          <a href="#how" className="hover:text-civic-blue transition-colors">How it works</a>
          <a href="#about" className="hover:text-civic-blue transition-colors">For everyone</a>
        </nav>
        <button
          onClick={() => navigate("/login")}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full transition-all"
          style={{ background: "var(--civic-navy)" }}
        >
          Get In
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [scene, setScene] = useState(0);
  const captions = [
    "Browse what your community is reporting",
    "Tap to file a new civic issue",
    "Photo + GPS captured automatically",
    "Routed to the right department",
    "Authorities notified in real time",
    "Neighbors confirm. Action follows.",
  ];

  return (
    <section className="relative pt-28 pb-20 px-6">
      <div className="absolute top-20 -left-20 w-96 h-96 blur-3xl rounded-full animate-blob -z-10" style={{ background: "oklch(0.62 0.18 245 / 0.2)" }} />
      <div className="absolute top-40 right-0 w-80 h-80 blur-3xl rounded-full animate-blob -z-10" style={{ background: "oklch(0.72 0.19 145 / 0.2)", animationDelay: "3s" }} />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full mb-5" style={{ background: "oklch(0.62 0.18 245 / 0.1)", color: "var(--civic-blue)" }}>
            Smart Civic Reporting Platform
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight" style={{ color: "var(--civic-navy)" }}>
            Your City.<br />
            <span style={{ background: "linear-gradient(to right, var(--civic-navy), var(--civic-blue))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Your Voice.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Report potholes, garbage, water leaks and more — with one tap, one photo, one GPS pin.
            CivicSense routes every issue to the right authority and tracks it until it's resolved.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/login")}
              className="font-semibold px-6 py-3 rounded-full flex items-center gap-2 text-white hover:gap-3 transition-all shadow-lg"
              style={{ background: "var(--civic-navy)", boxShadow: "0 8px 24px oklch(0.28 0.12 260 / 0.3)" }}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <motion.a
              href="#how"
              className="border-2 font-semibold px-6 py-3 rounded-full transition-all cursor-pointer"
              style={{ borderColor: "oklch(0.28 0.12 260 / 0.2)", color: "var(--civic-navy)" }}
              whileHover={{
                boxShadow: "0 0 18px oklch(0.62 0.18 245 / 0.45), 0 0 36px oklch(0.62 0.18 245 / 0.2)",
                borderColor: "oklch(0.62 0.18 245 / 0.7)",
                color: "var(--civic-blue)",
              }}
              whileTap={{ scale: 0.96, boxShadow: "0 0 10px oklch(0.62 0.18 245 / 0.6)" }}
            >
              See how it works
            </motion.a>
          </div>

          <motion.div key={scene} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mt-10 flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--civic-green)" }} />
            <span className="text-muted-foreground">Now showing:</span>
            <span className="font-semibold">{captions[scene]}</span>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
          <FloatCallout pos="top-8 -left-4 lg:-left-12" delay={0.6} icon={<MapPin className="w-4 h-4" style={{ color: "var(--civic-blue)" }} />} text="GPS locked ±28m" />
          <FloatCallout pos="top-32 -right-4 lg:-right-8" delay={1.0} icon={<Bell className="w-4 h-4" style={{ color: "var(--civic-amber)" }} />} text="Officer notified" />
          <FloatCallout pos="bottom-24 -left-4 lg:-left-16" delay={1.4} icon={<Users className="w-4 h-4" style={{ color: "var(--civic-green)" }} />} text="14 neighbors confirmed" />
          <PhoneDemo onSceneChange={setScene} />
        </motion.div>
      </div>
    </section>
  );
}

function FloatCallout({ pos, delay, icon, text }: { pos: string; delay: number; icon: React.ReactNode; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring" }}
      className={`absolute ${pos} z-20 hidden md:block`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay }}
        className="bg-card border border-border rounded-full px-4 py-2 flex items-center gap-2 text-xs font-semibold shadow-xl"
      >
        {icon} {text}
      </motion.div>
    </motion.div>
  );
}

function Stats() {
  const stats = [
    { v: "< 30s", l: "to file a report" },
    { v: "7+", l: "issue categories" },
    { v: "Real-time", l: "live updates" },
    { v: "3 roles", l: "Citizen · Officer · Admin" },
  ];
  return (
    <section className="px-6 -mt-4">
      <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--civic-navy) 0%, oklch(0.45 0.18 250) 50%, var(--civic-blue) 100%)", boxShadow: "0 20px 60px -20px oklch(0.28 0.12 260 / 0.35)" }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 animate-blob" />
        {stats.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="relative">
            <div className="font-display font-bold text-3xl md:text-4xl">{s.v}</div>
            <div className="text-sm opacity-80 mt-1">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Marquee() {
  const badges = [
    { icon: Sparkles, label: "12k+ Issues Reported" },
    { icon: TrendingUp, label: "85% Resolution Rate" },
    { icon: Users, label: "240+ Wards Covered" },
    { icon: Bell, label: "Real-time Sync" },
    { icon: Shield, label: "Community Verified" },
    { icon: MapPin, label: "GPS Tagged" },
  ];
  return (
    <section className="py-5 border-t border-b border-border/50 mt-4">
      <div className="w-full overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
        <div className="flex gap-8 animate-marquee">
          {[...badges, ...badges].map((badge, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
              <badge.icon className="w-4 h-4" style={{ color: "var(--civic-blue)" }} />
              <span className="font-semibold text-sm text-foreground">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Camera, title: "Photo + GPS Evidence", desc: "Geotagged photos with auto-compression. Cloudinary-backed storage." },
  { icon: MapPin, title: "Interactive Map", desc: "Leaflet maps show every nearby issue color-coded by severity and ward jurisdiction." },
  { icon: TrendingUp, title: "Trending Algorithm", desc: "Confirmations + recency surface what your community cares about right now." },
  { icon: Users, title: "Community Confirmation", desc: "Neighbors confirm reports are real. Consensus drives credibility and priority." },
  { icon: Bell, title: "Real-time Notifications", desc: "Status changes, comments, and escalations the instant they happen." },
  { icon: Shield, title: "Multi-role Authorization", desc: "Citizen, Authority Officer, Administrator — each gets the right tools and access." },
  { icon: MessageCircle, title: "Threaded Comments", desc: "Discuss issues directly with officers and other citizens until they're resolved." },
  { icon: BarChart3, title: "Admin Dashboard", desc: "System-wide oversight: resolution rates, escalations, ward maps, department health." },
];

function Features() {
  return (
    <section id="features" className="px-6 py-14">
      <div className="max-w-7xl mx-auto">
        <SectionHeader eyebrow="Everything in one platform" title={<>Built for <span style={{ color: "var(--civic-blue)" }}>civic action.</span></>} sub="From the first report to final resolution — every step is tracked, transparent, and timestamped." />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 4) * 0.08 }} whileHover={{ y: -6 }}
              className="bg-card border border-border rounded-2xl p-5 transition-all group hover:shadow-xl"
              style={{ ["--tw-shadow" as string]: "0 20px 40px -10px oklch(0.62 0.18 245 / 0.1)" }}
            >
              <div className="w-11 h-11 rounded-xl grid place-items-center mb-4 transition-colors group-hover:text-white" style={{ background: "oklch(0.62 0.18 245 / 0.1)", color: "var(--civic-blue)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--civic-blue)")}
                onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.62 0.18 245 / 0.1)")}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", icon: MapPin, title: "Locate", desc: "GPS pinpoints your exact location with sub-30-meter accuracy. Or pick on the map." },
  { n: "02", icon: Camera, title: "Capture", desc: "Snap a photo. Severity is auto-detected from category. Description is optional." },
  { n: "03", icon: Zap, title: "Route", desc: "The right department is auto-assigned. Officers get a real-time alert instantly." },
  { n: "04", icon: Check, title: "Resolve", desc: "Track Open → In Progress → Resolved. Neighbors confirm. Status updates in real time." },
];

function HowItWorks() {
  return (
    <section id="how" className="px-6 py-14 text-white relative overflow-hidden" style={{ background: "var(--civic-navy)" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(oklch(0.62 0.18 245) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader dark eyebrow="From tap to resolved" title={<>How <span style={{ color: "oklch(0.78 0.12 240)" }}>CivicSense</span> works</>} sub="Four steps. Zero friction. Full transparency." />
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="relative backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="font-display font-bold text-5xl mb-3" style={{ color: "oklch(0.78 0.12 240 / 0.4)" }}>{s.n}</div>
              <div className="w-10 h-10 rounded-xl grid place-items-center mb-3" style={{ background: "var(--civic-blue)" }}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl mb-1.5">{s.title}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  { title: "For Citizens", gradient: "linear-gradient(135deg, var(--civic-blue) 0%, oklch(0.78 0.12 240) 100%)", points: ["Report issues with photo + GPS", "Track your reports end-to-end", "Confirm and comment on neighbors' issues", "Real-time status notifications"] },
  { title: "For Authorities", gradient: "linear-gradient(135deg, var(--civic-navy) 0%, var(--civic-blue) 100%)", points: ["Structured dashboard of assigned issues", "Update status: Open → In Progress → Resolved", "Multi-department escalation", "Officer-level assignment & comments"] },
  { title: "For Administrators", gradient: "linear-gradient(135deg, var(--civic-navy-deep) 0%, var(--civic-navy) 100%)", points: ["System-wide oversight & analytics", "Manage departments and wards", "Handle escalations & high-priority issues", "Authority account management"] },
];

function About() {
  return (
    <section id="about" className="px-6 py-14">
      <div className="max-w-7xl mx-auto">
        {/* For everyone — roles */}
        <div id="roles">
          <SectionHeader eyebrow="Three roles, one system" title={<>Built for <span style={{ color: "var(--civic-blue)" }}>everyone</span> in the loop</>} sub="Citizens report. Authorities resolve. Administrators oversee. Everyone stays in sync." />
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl p-6 text-white relative overflow-hidden"
                style={{ background: r.gradient, boxShadow: "0 16px 40px -12px oklch(0.28 0.12 260 / 0.3)" }}
              >
                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/10 animate-blob" />
                <h3 className="font-display font-bold text-xl mb-4 relative">{r.title}</h3>
                <ul className="space-y-2.5 relative">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full bg-white/20 grid place-items-center flex-shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                      </div>
                      <span className="opacity-95">{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const navigate = useNavigate();
  return (
    <section id="cta" className="px-6 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--civic-navy) 0%, oklch(0.45 0.18 250) 50%, var(--civic-blue) 100%)", boxShadow: "0 16px 48px -16px oklch(0.28 0.12 260 / 0.35)" }}
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5 animate-blob" style={{ animationDelay: "4s" }} />
        <div className="relative">
          <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight">
            Don't just notice it.<br />Report it.
          </h2>
          <p className="mt-4 text-base opacity-90 max-w-xl mx-auto">
            Join the citizens making their cities visibly better — one geotagged report at a time.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/signup")}
              className="bg-white font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-xl text-sm"
              style={{ color: "var(--civic-navy)" }}
            >
              Sign Up Free
            </button>
            <button
              onClick={() => navigate("/login")}
              className="font-semibold px-6 py-3 rounded-full hover:scale-105 transition-transform border border-white/20 text-white text-sm"
              style={{ background: "var(--civic-navy-deep)" }}
            >
              Log In
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="relative overflow-hidden text-white" style={{ background: "linear-gradient(135deg, var(--civic-navy-deep) 0%, var(--civic-navy) 60%, oklch(0.35 0.15 250) 100%)" }}>
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10 animate-blob" style={{ background: "var(--civic-blue)" }} />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10 animate-blob" style={{ background: "var(--civic-green)", animationDelay: "4s" }} />

      <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* 1 — Project Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 relative grid place-items-center flex-shrink-0">
                <img src={civicLogo} alt="CivicSense" className="w-full h-full object-contain" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white/20" style={{ background: "var(--civic-green)" }} />
              </div>
              <span className="font-display font-bold text-base text-white">
                Civic<span style={{ color: "oklch(0.78 0.12 240)" }}>Sense</span>
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-3">Smart Civic Reporting Platform</p>
            <div className="space-y-1 text-xs text-white/60">
              <p className="font-medium text-white/80">Final Year Project – Computer Science</p>
              <p>Department of Information Technology</p>
              <p>XYZ College of Engineering</p>
              <p>Batch 2026</p>
            </div>
          </div>

          {/* 2 — Developed By */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Developed By</p>
            <ul className="space-y-2 text-sm">
              {["JAYASURYA S", "ABDULKALAM N", "ABISHAKE ANAND M", "VAISHAK M"].map(name => (
                <li key={name} className="font-semibold text-white/90">{name}</li>
              ))}
            </ul>
          </div>

          {/* 3 — Guide & Quick Links */}
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Project Guide</p>
              <div className="text-sm">
                <p className="font-semibold text-white">Prof. KALAIVANI</p>
                <p className="text-xs text-white/50 mt-0.5">Professor, Dept. of CS</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Quick Links</p>
              <ul className="space-y-2">
                {[
                  { label: "Home", href: "#" },
                  { label: "Features", href: "#features" },
                  { label: "How it Works", href: "#how" },
                  { label: "For Everyone", href: "#about" },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-xs text-white/60 hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4 — Contact & CTA */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">Contact</p>
            <div className="space-y-2.5 text-xs text-white/60 mb-6">
              <a href="mailto:civicsense@example.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <span className="w-5 h-5 rounded-full grid place-items-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>✉</span>
                civicsense@example.com
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                <span className="w-5 h-5 rounded-full grid place-items-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }}>in</span>
                linkedin.com/in/civicsense
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/signup")}
                className="text-xs font-semibold px-4 py-2 rounded-full transition-all hover:scale-105 text-center"
                style={{ background: "var(--civic-blue)" }}
              >
                Sign Up Free
              </button>
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-semibold px-4 py-2 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all text-center"
              >
                Log In
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>© {new Date().getFullYear()} CivicSense. All rights reserved.</span>
          <span>Final Year Project 2026</span>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, sub, dark }: { eyebrow: string; title: React.ReactNode; sub: string; dark?: boolean }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full mb-4`}
        style={dark ? { background: "rgba(255,255,255,0.1)", color: "oklch(0.78 0.12 240)" } : { background: "oklch(0.62 0.18 245 / 0.1)", color: "var(--civic-blue)" }}>
        {eyebrow}
      </div>
      <h2 className="font-display font-bold text-4xl md:text-5xl leading-tight">{title}</h2>
      <p className={`mt-4 text-lg ${dark ? "text-white/70" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}
