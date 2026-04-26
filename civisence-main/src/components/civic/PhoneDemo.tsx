import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bell, Home, Map, Plus, FileText, User, MapPin, Camera,
  Check, MessageCircle, Send, TrendingUp,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";

type Scene = "home" | "report" | "capture" | "submit" | "success" | "comments";

const SCENES: { id: Scene; label: string; duration: number }[] = [
  { id: "home", label: "Browse trending civic issues", duration: 3800 },
  { id: "report", label: "Tap to report a new issue", duration: 3200 },
  { id: "capture", label: "Capture geotagged photo evidence", duration: 3600 },
  { id: "submit", label: "Submit with one tap", duration: 3000 },
  { id: "success", label: "Authorities are notified instantly", duration: 3000 },
  { id: "comments", label: "Community confirms & comments", duration: 3800 },
];

export function PhoneDemo({ onSceneChange }: { onSceneChange?: (i: number) => void }) {
  const [idx, setIdx] = useState(0);
  const scene = SCENES[idx];

  useEffect(() => {
    onSceneChange?.(idx);
    const t = setTimeout(() => setIdx((i) => (i + 1) % SCENES.length), scene.duration);
    return () => clearTimeout(t);
  }, [idx, scene.duration, onSceneChange]);

  return (
    <div className="flex flex-col items-center gap-6">
      <PhoneFrame>
        <AnimatePresence mode="wait">
          {scene.id === "home" && <HomeScreen key="home" />}
          {scene.id === "report" && <ReportLocationScreen key="report" />}
          {scene.id === "capture" && <CaptureScreen key="capture" />}
          {scene.id === "submit" && <SubmitScreen key="submit" />}
          {scene.id === "success" && <SuccessScreen key="success" />}
          {scene.id === "comments" && <CommentsScreen key="comments" />}
        </AnimatePresence>
        <BottomNavDemo active={scene.id} />
      </PhoneFrame>

      <div className="flex flex-col items-center gap-3 max-w-sm">
        <div className="flex gap-1.5">
          {SCENES.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === idx ? "w-8 bg-civic-blue" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={scene.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm font-medium text-muted-foreground text-center"
          >
            {scene.label}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

const screenWrap = "absolute inset-0 pt-10 pb-20 px-4 overflow-hidden bg-[#f8fafc]";

function ScreenHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 text-white relative overflow-hidden"
      style={{ background: "var(--gradient-card)" }}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 animate-blob" />
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Check className="w-4 h-4" strokeWidth={3} />
          </div>
          <div>
            <div className="font-display font-bold text-sm">{title}</div>
            <div className="text-[10px] opacity-80">{sub}</div>
          </div>
        </div>
        <Bell className="w-4 h-4 opacity-80" />
      </div>
    </motion.div>
  );
}

function HomeScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="CivicSense" sub="Smart Civic Reporting" />
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-3 rounded-2xl p-4 text-white"
        style={{ background: "var(--gradient-card)" }}
      >
        <div className="font-display font-bold text-base">Your City. Your Voice.</div>
        <div className="text-[11px] opacity-90 mt-1">Report problems and help improve your community.</div>
      </motion.div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-4 h-4 text-civic-blue" />
          <div className="font-semibold text-sm">Trending Issues</div>
          <div className="ml-auto flex gap-1">
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">Unsolved</span>
            <span className="text-[10px] border border-border px-2 py-0.5 rounded-full">Solved</span>
          </div>
        </div>
        {[
          { cat: "Pothole", sev: "Severe", time: "12 Apr", reps: 4 },
          { cat: "Garbage", sev: "Medium", time: "14 Apr", reps: 2 },
        ].map((it, i) => (
          <motion.div
            key={it.cat}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 + i * 0.15 }}
            className="bg-white rounded-xl p-2.5 mb-2 border border-border flex gap-2 items-center"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-300 to-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium ${it.sev === "Severe" ? "bg-red-500" : "bg-amber-500"}`}>{it.sev}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">Open</span>
              </div>
              <div className="font-semibold text-xs mt-0.5">{it.cat}</div>
              <div className="text-[9px] text-muted-foreground">{it.time} · {it.reps} reports</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ReportLocationScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="Report Issue" sub="Help improve your community" />
      <Stepper step={1} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="mt-4 bg-white rounded-2xl p-6 flex flex-col items-center text-center border border-border"
      >
        <div className="relative mb-3">
          <span className="absolute inset-0 rounded-full bg-civic-blue/30" style={{ animation: "ping-soft 1.6s ease-out infinite" }} />
          <div className="relative w-16 h-16 rounded-full bg-civic-blue/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-civic-blue" />
          </div>
        </div>
        <div className="font-display font-bold">Access Location</div>
        <div className="text-[11px] text-muted-foreground mt-1 mb-4">We need your exact location to tag the civic issue accurately.</div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="text-white text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-2"
          style={{ background: "var(--civic-blue)" }}
        >
          <MapPin className="w-3.5 h-3.5" /> Get Location
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function CaptureScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="Report Issue" sub="Help improve your community" />
      <Stepper step={2} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 bg-white rounded-2xl p-4 border border-border">
        <div className="font-semibold text-sm mb-2">Take a Photo</div>
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
          <motion.div
            initial={{ y: "-100%" }} animate={{ y: "100%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-white/40 to-transparent"
          />
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </motion.div>
          </div>
        </div>
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="mt-3 text-white text-xs font-semibold py-2.5 rounded-full flex items-center justify-center gap-2"
          style={{ background: "var(--civic-blue)" }}
        >
          <Camera className="w-3.5 h-3.5" /> Capture Photo
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function SubmitScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="Report Issue" sub="Help improve your community" />
      <Stepper step={4} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 bg-white rounded-2xl p-4 border border-border space-y-2.5">
        <div className="font-semibold text-sm">Review & Submit</div>
        {[["Category", "Electric Cable Issue"], ["Department", "Electricity Dept."], ["Ward", "Hosur"], ["Location", "12.7594, 77.8129"]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] border-b border-border pb-1.5">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-medium">{v}</span>
          </div>
        ))}
        <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-300 to-blue-500" />
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-white text-xs font-semibold py-2.5 rounded-full text-center"
          style={{ background: "var(--civic-blue)" }}
        >
          Submit Report
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function SuccessScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="My Reports" sub="2 issues reported" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 bg-white rounded-2xl p-4 border border-border">
        <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-300 to-blue-500 mb-3" />
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-medium">Severe</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted font-medium">Open</span>
        </div>
        <div className="font-semibold text-xs">Electric Cable Issue</div>
        <div className="text-[9px] text-muted-foreground">12.75949, 77.81290</div>
      </motion.div>
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="mt-4 bg-green-500/15 border border-green-500/40 rounded-full px-3 py-2 flex items-center gap-2"
      >
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" strokeWidth={4} />
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--civic-navy)" }}>Report submitted successfully!</span>
      </motion.div>
    </motion.div>
  );
}

function CommentsScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={screenWrap}>
      <ScreenHeader title="Issue Detail" sub="Pothole · Road Maintenance" />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-3 bg-white rounded-2xl p-3 border border-border flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="flex-1 text-xs font-semibold py-2 rounded-full text-civic-blue flex items-center justify-center gap-1 bg-civic-blue/10"
        >
          <Check className="w-3.5 h-3.5" /> Confirm
        </motion.button>
        <button className="flex-1 text-xs font-semibold py-2 rounded-full border border-border flex items-center justify-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" /> Comment
        </button>
      </motion.div>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 bg-white rounded-2xl border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-civic-blue" />
            <span className="text-xs font-semibold">Comments</span>
          </div>
        </div>
        <div className="flex gap-1.5 mb-2">
          <div className="w-6 h-6 rounded-full bg-civic-blue text-white grid place-items-center text-[10px] font-bold flex-shrink-0">J</div>
          <div className="bg-muted rounded-2xl px-3 py-1.5 text-[11px]">he is right</div>
        </div>
        <motion.div
          initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="flex gap-1.5 mb-2 justify-end"
        >
          <div className="text-white rounded-2xl px-3 py-1.5 text-[11px]" style={{ background: "var(--civic-blue)" }}>Yes, there is an issue</div>
          <div className="w-6 h-6 rounded-full text-white grid place-items-center text-[10px] font-bold flex-shrink-0" style={{ background: "var(--civic-navy)" }}>A</div>
        </motion.div>
        <div className="flex gap-1.5 items-center bg-muted rounded-full px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground flex-1">Write a comment…</span>
          <Send className="w-3.5 h-3.5 text-civic-blue" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-3 bg-white rounded-2xl p-3 border border-border flex items-center justify-between">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="flex flex-col items-center gap-1 flex-1">
          <div className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold ${n <= step ? "text-white" : "bg-muted text-muted-foreground"}`}
            style={n <= step ? { background: "var(--civic-blue)" } : {}}>
            {n < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
          </div>
          <span className="text-[9px] text-muted-foreground">{["Location", "Capture", "Details", "Submit"][n - 1]}</span>
        </div>
      ))}
    </div>
  );
}

function BottomNavDemo({ active }: { active: Scene }) {
  const items = [
    { icon: Home, label: "Home", scenes: ["home"] },
    { icon: Map, label: "Map", scenes: [] },
    { icon: Plus, label: "Report", scenes: ["report", "capture", "submit"], primary: true },
    { icon: FileText, label: "Reports", scenes: ["success"] },
    { icon: User, label: "Account", scenes: ["comments"] },
  ];
  return (
    <div className="absolute bottom-0 inset-x-0 bg-white border-t border-border px-3 py-2 flex items-center justify-around">
      {items.map(({ icon: Icon, label, scenes, primary }) => {
        const isActive = scenes.includes(active);
        if (primary) {
          return (
            <div key={label} className="-mt-6">
              <div className="w-12 h-12 rounded-full grid place-items-center shadow-lg" style={{ background: "var(--civic-blue)" }}>
                <Plus className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
            </div>
          );
        }
        return (
          <div key={label} className={`flex flex-col items-center gap-0.5`} style={{ color: isActive ? "var(--civic-blue)" : undefined }}>
            <Icon className={`w-4 h-4 ${!isActive ? "text-muted-foreground" : ""}`} />
            <span className="text-[9px] font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
