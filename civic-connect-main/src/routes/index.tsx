import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  MapPin, Camera, Users, Bell, Shield, BarChart3, Zap, Check,
  ArrowRight, Sparkles, MessageCircle, TrendingUp,
} from "lucide-react";
import { PhoneDemo } from "@/components/civic/PhoneDemo";
import { Button } from "@/components/ui/button";
import civicLogo from "@/assets/civic-logo.png";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CivicSense — Smart Civic Issue Reporting" },
      { name: "description", content: "Report potholes, garbage, water leaks and more. CivicSense connects citizens with municipal authorities through real-time, geotagged civic issue reporting." },
      { property: "og:title", content: "CivicSense — Your City. Your Voice." },
      { property: "og:description", content: "A smart platform that lets citizens report civic issues with photo + GPS, and helps authorities resolve them faster." },
    ],
  }),
});

function Landing() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Nav />
      <Hero />
      <Stats />
      <Marquee />
      <Features />
      <HowItWorks />
      <Roles />
      <CTA />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <div className="relative w-9 h-9 grid place-items-center">
            <img src={civicLogo} alt="CivicSense logo" className="w-full h-full object-contain" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-civic-green border-2 border-background" />
          </div>
          <span className="font-display font-bold text-lg">
            Civic<span className="text-civic-blue">Sense</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-civic-blue transition-colors">Features</a>
          <a href="#how" className="hover:text-civic-blue transition-colors">How it works</a>
          <a href="#roles" className="hover:text-civic-blue transition-colors">For everyone</a>
        </nav>
        <Button asChild variant="hero" size="sm" className="group px-4 py-2 text-sm">
          <a href="#cta">
            <span className="relative z-10 inline-flex items-center gap-2">
              Get In
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </a>
        </Button>
      </div>
    </header>
  );
}

function Hero() {
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
      {/* background blobs */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-civic-blue/20 blur-3xl rounded-full animate-blob -z-10" />
      <div className="absolute top-40 right-0 w-80 h-80 bg-civic-green/20 blur-3xl rounded-full animate-blob -z-10" style={{ animationDelay: "3s" }} />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        {/* left */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center bg-civic-blue/10 text-civic-blue text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            Smart Civic Reporting Platform
          </div>
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            Your City.<br />
            <span className="bg-gradient-to-r from-civic-navy via-civic-blue to-civic-blue-soft bg-clip-text text-transparent">
              Your Voice.
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Report potholes, garbage, water leaks and more — with one tap, one photo, one GPS pin.
            CivicSense routes every issue to the right authority and tracks it until it's resolved.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#cta" className="bg-civic-navy text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-civic-blue transition-all hover:gap-3 shadow-lg shadow-civic-navy/30">
              Report an issue <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#how" className="border-2 border-civic-navy/15 font-semibold px-6 py-3 rounded-full hover:border-civic-blue hover:text-civic-blue transition-colors">
              See how it works
            </a>
          </div>

          <motion.div
            key={scene}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mt-10 flex items-center gap-3 text-sm"
          >
            <div className="w-2 h-2 rounded-full bg-civic-green animate-pulse" />
            <span className="text-muted-foreground">Now showing:</span>
            <span className="font-semibold">{captions[scene]}</span>
          </motion.div>
        </motion.div>

        {/* right: phone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* floating callouts */}
          <FloatCallout pos="top-8 -left-4 lg:-left-12" delay={0.6} icon={<MapPin className="w-4 h-4 text-civic-blue" />} text="GPS locked ±28m" />
          <FloatCallout pos="top-32 -right-4 lg:-right-8" delay={1.0} icon={<Bell className="w-4 h-4 text-civic-amber" />} text="Officer notified" />
          <FloatCallout pos="bottom-24 -left-4 lg:-left-16" delay={1.4} icon={<Users className="w-4 h-4 text-civic-green" />} text="14 neighbors confirmed" />

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
    { v: "Real-time", l: "Socket.io updates" },
    { v: "3 roles", l: "Citizen · Officer · Admin" },
  ];
  return (
    <section className="px-6 -mt-4">
      <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-white relative overflow-hidden" style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-civic)" }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 animate-blob" />
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
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
    <section className="py-6 border-t border-b border-border/50">
      <div className="w-full overflow-hidden" style={{
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
      }}>
        <div className="flex gap-8 animate-marquee">
          {/* First set */}
          {badges.map((badge, i) => (
            <div key={`first-${i}`} className="inline-flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
              <badge.icon className="w-4 h-4 text-civic-blue" />
              <span className="font-semibold text-sm text-foreground">{badge.label}</span>
            </div>
          ))}
          {/* Duplicate set for seamless loop */}
          {badges.map((badge, i) => (
            <div key={`second-${i}`} className="inline-flex items-center gap-2 px-5 py-2 rounded-full whitespace-nowrap bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg">
              <badge.icon className="w-4 h-4 text-civic-blue" />
              <span className="font-semibold text-sm text-foreground">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Camera, title: "Photo + GPS Evidence", desc: "Geotagged photos with auto-compression. 10MB limit, Cloudinary-backed storage." },
  { icon: MapPin, title: "Interactive Map", desc: "Leaflet maps show every nearby issue color-coded by severity and ward jurisdiction." },
  { icon: TrendingUp, title: "Trending Algorithm", desc: "Confirmations + recency decay surface what your community cares about right now." },
  { icon: Users, title: "Community Confirmation", desc: "Neighbors confirm reports are real. Consensus drives credibility and priority." },
  { icon: Bell, title: "Real-time Notifications", desc: "Socket.io pushes status changes, comments, and escalations the instant they happen." },
  { icon: Shield, title: "Multi-role Authorization", desc: "Citizen, Authority Officer, Administrator — each gets the right tools and access." },
  { icon: MessageCircle, title: "Threaded Comments", desc: "Discuss issues directly with officers and other citizens until they're resolved." },
  { icon: BarChart3, title: "Admin Dashboard", desc: "System-wide oversight: resolution rates, escalations, ward maps, department health." },
];

function Features() {
  return (
    <section id="features" className="px-6 py-28">
      <div className="max-w-7xl mx-auto">
        <SectionHeader eyebrow="Everything in one platform" title={<>Built for <span className="text-civic-blue">civic action.</span></>} sub="From the first report to final resolution — every step is tracked, transparent, and timestamped." />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 4) * 0.08 }}
              whileHover={{ y: -6 }}
              className="bg-card border border-border rounded-2xl p-5 hover:border-civic-blue/50 hover:shadow-xl hover:shadow-civic-blue/10 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-civic-blue/10 grid place-items-center mb-4 group-hover:bg-civic-blue group-hover:text-white transition-colors text-civic-blue">
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
  { n: "03", icon: Zap, title: "Route", desc: "The right department is auto-assigned. Officers get a real-time alert via Socket.io." },
  { n: "04", icon: Check, title: "Resolve", desc: "Track Open → In Progress → Resolved. Neighbors confirm. Status updates in real time." },
];

function HowItWorks() {
  return (
    <section id="how" className="px-6 py-28 bg-civic-navy text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(oklch(0.62 0.18 245) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="max-w-7xl mx-auto relative">
        <SectionHeader
          dark
          eyebrow="From tap to resolved"
          title={<>How <span className="text-civic-blue-soft">CivicSense</span> works</>}
          sub="Four steps. Zero friction. Full transparency."
        />
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="font-display font-bold text-5xl text-civic-blue-soft/40 mb-3">{s.n}</div>
              <div className="w-10 h-10 rounded-xl bg-civic-blue grid place-items-center mb-3">
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl mb-1.5">{s.title}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-civic-blue-soft/60" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLES = [
  {
    title: "For Citizens",
    color: "from-civic-blue to-civic-blue-soft",
    points: ["Report issues with photo + GPS", "Track your reports end-to-end", "Confirm and comment on neighbors' issues", "Real-time status notifications"],
  },
  {
    title: "For Authorities",
    color: "from-civic-navy to-civic-blue",
    points: ["Structured dashboard of assigned issues", "Update status: Open → In Progress → Resolved", "Multi-department escalation", "Officer-level assignment & comments"],
  },
  {
    title: "For Administrators",
    color: "from-civic-navy-deep to-civic-navy",
    points: ["System-wide oversight & analytics", "Manage departments and wards", "Handle escalations & high-priority issues", "Authority account management"],
  },
];

function Roles() {
  return (
    <section id="roles" className="px-6 py-28">
      <div className="max-w-7xl mx-auto">
        <SectionHeader eyebrow="Three roles, one system" title={<>Built for <span className="text-civic-blue">everyone</span> in the loop</>} sub="Citizens report. Authorities resolve. Administrators oversee. Everyone stays in sync." />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className={`rounded-3xl p-7 text-white bg-gradient-to-br ${r.color} relative overflow-hidden`}
              style={{ boxShadow: "var(--shadow-civic)" }}
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 animate-blob" />
              <h3 className="font-display font-bold text-2xl mb-5 relative">{r.title}</h3>
              <ul className="space-y-3 relative">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-white/20 grid place-items-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="opacity-95">{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="px-6 py-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden"
        style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-civic)" }}
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-civic-green/30 animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/10 animate-blob" style={{ animationDelay: "4s" }} />
        <div className="relative">
          <h2 className="font-display font-bold text-4xl md:text-6xl leading-tight">
            Don't just notice it.<br />Report it.
          </h2>
          <p className="mt-5 text-lg opacity-90 max-w-xl mx-auto">
            Join the citizens making their cities visibly better — one geotagged report at a time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="bg-white text-civic-navy font-semibold px-7 py-3.5 rounded-full hover:scale-105 transition-transform shadow-xl">
              Download for iOS
            </button>
            <button className="bg-civic-navy-deep text-white font-semibold px-7 py-3.5 rounded-full hover:scale-105 transition-transform border border-white/20">
              Download for Android
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-3 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6">
            <img src={civicLogo} alt="CivicSense logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-foreground">CivicSense</span>
          <span>· Smart Civic Reporting</span>
        </div>
        <div>© {new Date().getFullYear()} CivicSense. Your City. Your Voice.</div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, sub, dark }: { eyebrow: string; title: React.ReactNode; sub: string; dark?: boolean }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full mb-4 ${dark ? "bg-white/10 text-civic-blue-soft" : "bg-civic-blue/10 text-civic-blue"}`}>
        {eyebrow}
      </div>
      <h2 className="font-display font-bold text-4xl md:text-5xl leading-tight">{title}</h2>
      <p className={`mt-4 text-lg ${dark ? "text-white/70" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}
