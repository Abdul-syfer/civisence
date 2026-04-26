import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { CivicIssue } from "@/lib/types";
import { subscribeToIssuesByUser } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import StatusTimeline from "@/components/StatusTimeline";
import SeverityBadge from "@/components/SeverityBadge";
import { MapPin, ChevronDown, ChevronUp, Loader2, X, MessageCircle, Clock, CheckCircle2, AlertCircle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CommentsSheet from "@/components/CommentsSheet";

type StatusFilter = "all" | "open" | "in_progress" | "resolved" | "rejected";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-l-destructive",
    dot: "bg-destructive",
    step: 0,
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
    step: 1,
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    step: 2,
  },
  rejected: {
    label: "Rejected",
    icon: Ban,
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-l-muted-foreground",
    dot: "bg-muted-foreground",
    step: -1,
  },
};

const PIPELINE = ["open", "in_progress", "resolved"] as const;

const ImageLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button type="button" onClick={onClose}
      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10">
      <X className="w-5 h-5" />
    </button>
    <motion.img src={src} alt={alt} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
  </motion.div>
);

const CitizenMyReports = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const [commentsIssue, setCommentsIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToIssuesByUser(user.uid, issues => { setIssues(issues); setLoading(false); });
    return () => unsub();
  }, [user?.uid]);

  const counts = {
    all: issues.length,
    open: issues.filter(i => i.status === "open").length,
    in_progress: issues.filter(i => i.status === "in_progress").length,
    resolved: issues.filter(i => i.status === "resolved").length,
    rejected: issues.filter(i => i.status === "rejected").length,
  };

  const filtered = filter === "all" ? issues : issues.filter(i => i.status === filter);

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "resolved", label: "Resolved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="gradient-primary px-5 pt-safe-header pb-6 rounded-b-3xl">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-xl font-bold text-primary-foreground">My Reports</h1>
          <p className="text-sm text-primary-foreground/70 mt-0.5">{loading ? "…" : `${issues.length} issues reported`}</p>
          {!loading && issues.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {counts.open > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-destructive/20 text-white">{counts.open} Open</span>
              )}
              {counts.in_progress > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-400/20 text-white">{counts.in_progress} In Progress</span>
              )}
              {counts.resolved > 0 && (
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-400/20 text-white">{counts.resolved} Resolved</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="px-5 mt-4 max-w-2xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.filter(t => t.key === "all" || counts[t.key] > 0).map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={cn(
                "flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all",
                filter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}>
              {tab.label}
              {tab.key !== "all" && counts[tab.key] > 0 && (
                <span className={cn("ml-1.5 text-[10px] font-bold", filter === tab.key ? "opacity-80" : "opacity-60")}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{filter === "all" ? "You haven't reported any issues yet." : `No ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label ?? ""} issues.`}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((issue, i) => {
              const cfg = STATUS_CONFIG[issue.status];
              const StatusIcon = cfg.icon;
              const currentStep = cfg.step;

              return (
                <motion.div key={issue.id} layout
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("bg-card rounded-xl border border-border border-l-4 shadow-sm overflow-hidden", cfg.border)}>

                  {/* Photo */}
                  {(issue.imageUrl || issue.resolvedImageUrl) && (
                    issue.status === "resolved" && issue.resolvedImageUrl ? (
                      <div className="flex h-36">
                        <div className="relative flex-1 overflow-hidden">
                          <img src={issue.imageUrl} alt="Before" className="w-full h-full object-cover cursor-pointer"
                            onClick={() => { setLightboxSrc(issue.imageUrl); setLightboxAlt(`${issue.title} — Before`); }} />
                          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">BEFORE</span>
                        </div>
                        <div className="w-px bg-border flex-shrink-0" />
                        <div className="relative flex-1 overflow-hidden">
                          <img src={issue.resolvedImageUrl} alt="After" className="w-full h-full object-cover cursor-pointer"
                            onClick={() => { setLightboxSrc(issue.resolvedImageUrl!); setLightboxAlt(`${issue.title} — After`); }} />
                          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-emerald-600/80 text-white px-1.5 py-0.5 rounded-full">AFTER</span>
                        </div>
                      </div>
                    ) : issue.imageUrl ? (
                      <img src={issue.imageUrl} alt={issue.title} className="w-full h-32 object-cover cursor-pointer"
                        onClick={() => { setLightboxSrc(issue.imageUrl); setLightboxAlt(issue.title); }} />
                    ) : null
                  )}

                  <div className="p-4">
                    {/* Status header row */}
                    <div className={cn("flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full w-fit mb-3", cfg.bg, cfg.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>

                    {/* Pipeline progress (only for non-rejected) */}
                    {issue.status !== "rejected" && (
                      <div className="flex items-center gap-1 mb-3">
                        {PIPELINE.map((step, idx) => {
                          const done = idx <= currentStep;
                          const active = idx === currentStep;
                          return (
                            <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
                              <div className={cn("w-2 h-2 rounded-full transition-all flex-shrink-0",
                                done ? (active ? cfg.dot + " ring-2 ring-offset-1 ring-current" : cfg.dot + " opacity-60") : "bg-border")} />
                              {idx < PIPELINE.length - 1 && (
                                <div className={cn("h-px flex-1 transition-all", idx < currentStep ? cfg.dot + " opacity-40" : "bg-border")}
                                  style={{ background: idx < currentStep ? undefined : undefined }} />
                              )}
                            </div>
                          );
                        })}
                        <span className="text-[9px] text-muted-foreground ml-1 whitespace-nowrap">
                          {["Open", "In Progress", "Resolved"][Math.max(0, currentStep)]}
                        </span>
                      </div>
                    )}

                    {/* Title row + expand toggle */}
                    <button type="button" onClick={() => setExpanded(expanded === issue.id ? null : issue.id)} className="w-full text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <SeverityBadge severity={issue.severity} />
                            <span className="text-[10px] text-muted-foreground">{issue.category}</span>
                          </div>
                          <h3 className="font-display font-semibold text-sm text-foreground leading-snug">{issue.title}</h3>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{issue.location}</span>
                          </div>
                        </div>
                        {expanded === issue.id
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expanded === issue.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            {issue.description && <p className="text-sm text-muted-foreground">{issue.description}</p>}
                            <StatusTimeline steps={issue.timeline} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <button type="button" onClick={() => setCommentsIssue(issue)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Comments{(issue.commentCount ?? 0) > 0 && <span className="ml-0.5 font-semibold">{issue.commentCount}</span>}
                      </button>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {commentsIssue && (
        <CommentsSheet issueId={commentsIssue.id} issueTitle={commentsIssue.title}
          open={!!commentsIssue} onClose={() => setCommentsIssue(null)} />
      )}

      <AnimatePresence>
        {lightboxSrc && <ImageLightbox src={lightboxSrc} alt={lightboxAlt} onClose={() => setLightboxSrc(null)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CitizenMyReports;
