import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { getAllIssues, confirmIssue } from "@/lib/firestore";
import { CivicIssue, Severity } from "@/lib/types";
import SeverityBadge from "@/components/SeverityBadge";
import { MapPin, Users, Clock, X, Navigation, AlertTriangle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IssueMap from "@/components/IssueMap";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SeverityFilter = Severity | "all";
type StatusFilter = "all" | "open" | "resolved";

const severityColors: Record<Severity, string> = {
  severe: "#ef4444",
  medium: "#f59e0b",
  minor: "#22c55e",
};

const statusLabels: Record<CivicIssue["status"], string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected"
};

const formatRelativeDate = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const CitizenMap = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<CivicIssue | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [panToUser, setPanToUser] = useState(0); // bump to trigger map pan

  // Load all issues once
  useEffect(() => {
    getAllIssues()
      .then(setIssues)
      .catch(() => toast.error("Failed to load issues"))
      .finally(() => setLoading(false));
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn(`Geolocation error (code ${err.code}):`, err.message);
        if (err.code === 1) {
          // Permission denied — tell the user how to fix it, don't guess their location
          setLocationError("Location access denied. To enable it, open your browser settings and allow location for this site.");
        } else if (err.code === 2) {
          setLocationError("Your location is currently unavailable. Please try again.");
        } else {
          setLocationError("Location request timed out. Please try again.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = async (issue: CivicIssue) => {
    if (!user) return;
    try {
      await confirmIssue(issue.id, user.uid, issue.status === "resolved");
      setIssues(prev => prev.map(i =>
        i.id === issue.id ? { ...i, reportCount: i.reportCount + 1 } : i
      ));
      toast.success(issue.status === "resolved" ? "Resolution confirmed! Thank you." : "Issue confirmed! Thank you.");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "already_confirmed") {
        toast.info("You've already confirmed this issue.");
      } else {
        toast.error("Failed to confirm. Please try again.");
      }
    }
  };

  // Counts for filter badges
  const countBySeverity = (s: SeverityFilter) =>
    s === "all" ? issues.length : issues.filter(i => i.severity === s).length;

  const countByStatus = (s: StatusFilter) => {
    if (s === "all") return issues.length;
    if (s === "open") return issues.filter(i => i.status !== "resolved").length;
    return issues.filter(i => i.status === "resolved").length;
  };

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "severe", label: "Severe" },
    { value: "medium", label: "Medium" },
    { value: "minor", label: "Minor" },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-nav relative overflow-hidden">
      {/* Map fills entire screen */}
      <div className="absolute inset-0 bottom-16">
        <IssueMap
          issues={issues}
          userLocation={userLocation}
          onSelectIssue={setSelected}
          severityFilter={severityFilter}
          statusFilter={statusFilter}
          panToUser={panToUser}
          center={userLocation ? [userLocation.lat, userLocation.lng] : [28.6139, 77.209]}
          zoom={14}
          className="h-full w-full"
        />
      </div>

      {/* ── Top Controls ────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1001] pt-safe-header px-4 space-y-2 pointer-events-none">

        {/* Status toggle pill */}
        <div className="flex justify-center pointer-events-auto">
          <div className="flex items-center bg-card/95 backdrop-blur-md rounded-full p-1 shadow-xl border border-border">
            {(["all", "open", "resolved"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-[11px] font-semibold px-4 py-1.5 rounded-full transition-all",
                  statusFilter === s
                    ? s === "resolved"
                      ? "bg-success text-success-foreground shadow"
                      : s === "open"
                        ? "bg-destructive text-destructive-foreground shadow"
                        : "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "all" ? `All (${countByStatus("all")})` : s === "open" ? `Open (${countByStatus("open")})` : `Resolved (${countByStatus("resolved")})`}
              </button>
            ))}
          </div>
        </div>

        {/* Severity filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pointer-events-auto">
          {severityOptions.map(({ value, label }) => {
            const count = countBySeverity(value);
            const active = severityFilter === value;
            const dotColor = value !== "all" ? severityColors[value as Severity] : undefined;
            return (
              <button
                key={value}
                onClick={() => setSeverityFilter(value)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border shadow-md transition-all whitespace-nowrap",
                  active
                    ? "bg-card text-foreground border-foreground/30 shadow-lg scale-105"
                    : "bg-card/85 backdrop-blur-sm text-muted-foreground border-border hover:bg-card"
                )}
              >
                {dotColor && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
                {label}
                <span className={cn("font-bold", active ? "text-foreground" : "text-muted-foreground/60")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Location error / retry banner ───────────────── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-40 left-4 right-4 z-[1002]"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2 shadow-lg backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-destructive font-medium leading-snug">{locationError}</p>
              </div>
              <button
                onClick={requestLocation}
                disabled={locating}
                className="flex items-center gap-1 text-xs text-destructive font-semibold underline underline-offset-2 flex-shrink-0"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right-side FAB buttons ───────────────────────── */}
      <div className="absolute top-36 right-4 z-[1002] flex flex-col gap-2">
        {/* Locate me */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (userLocation) {
              setPanToUser(c => c + 1);
            } else {
              requestLocation();
            }
          }}
          className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm shadow-xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
          title="Go to my location"
        >
          {locating
            ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
            : <Navigation className="w-4 h-4 text-primary" />
          }
        </motion.button>
      </div>

      {/* ── Stats bar (bottom of map, above bottom nav) ─── */}
      {!loading && (
        <div className="absolute bottom-20 left-4 right-4 z-[1001] pointer-events-none">
          <div className="flex gap-2 justify-center">
            {[
              { color: severityColors.severe, label: "Severe", count: issues.filter(i => i.severity === "severe").length },
              { color: severityColors.medium, label: "Medium", count: issues.filter(i => i.severity === "medium").length },
              { color: severityColors.minor, label: "Minor", count: issues.filter(i => i.severity === "minor").length },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 border border-border shadow text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Issue detail bottom sheet ────────────────────── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed bottom-20 left-0 right-0 px-4 z-[1002]"
          >
            <div className="bg-card rounded-2xl border border-border shadow-2xl p-4 max-w-lg mx-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SeverityBadge severity={selected.severity} size="md" />
                    <Badge variant="outline" className="text-[10px]">{selected.category}</Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        selected.status === "resolved" ? "border-success/30 text-success bg-success/10" :
                        selected.status === "in_progress" ? "border-warning/30 text-warning bg-warning/10" :
                        "border-destructive/30 text-destructive bg-destructive/10"
                      )}
                    >
                      {statusLabels[selected.status]}
                    </Badge>
                  </div>
                  <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{selected.title}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground ml-2 flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo if available */}
              {selected.imageUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-border">
                  <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Meta */}
              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-mono truncate">{selected.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelativeDate(selected.reportedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{selected.reportCount} report{selected.reportCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-primary/80 font-medium">{selected.department}</div>
                {selected.description && (
                  <p className="text-foreground/70 italic leading-relaxed line-clamp-2">{selected.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "flex-1 text-xs",
                    selected.status === "resolved"
                      ? "border-success/30 text-success hover:bg-success/10"
                      : "border-primary/30 text-primary hover:bg-primary/5"
                  )}
                  onClick={() => handleConfirm(selected)}
                >
                  {selected.status === "resolved"
                    ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Confirm Resolved</>
                    : <><Users className="w-3 h-3 mr-1" /> Confirm Issue</>
                  }
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CitizenMap;
