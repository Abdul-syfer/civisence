import { useState, useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { subscribeToIssuesByWard, updateIssueStatus, updateIssueFields, createNotification, incrementAuthorityResolvedCount } from "@/lib/firestore";
import { CivicIssue, Severity, issueCategories } from "@/lib/types";
import SeverityBadge from "@/components/SeverityBadge";
import { MapPin, Users, Clock, X, Navigation, AlertTriangle, Loader2, RefreshCw, Play, CheckCircle, XCircle, ExternalLink, ChevronUp, ChevronDown, Camera, MessageCircle, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IssueMap from "@/components/IssueMap";
import { useAuth } from "@/lib/authContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadToCloudinary } from "@/lib/cloudinary";
import CommentsSheet from "@/components/CommentsSheet";

type SeverityFilter = Severity | "all";
type StatusFilter = "all" | "open" | "in_progress" | "resolved";

const severityColors: Record<Severity, string> = {
  severe: "bg-destructive",
  medium: "bg-warning",
  minor: "bg-success",
};


const statusLabels: Record<CivicIssue["status"], string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected",
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

const AuthorityMap = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<CivicIssue | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>(
    (searchParams.get("filter") as SeverityFilter) || "all"
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [panToUser, setPanToUser] = useState(0);

  // Real-time issues subscription — filtered by ward + department
  useEffect(() => {
    if (!user?.ward) { setLoading(false); return; }
    const unsub = subscribeToIssuesByWard(
      user.ward,
      (wardIssues) => {
        const filtered = user.department
          ? wardIssues.filter(i =>
              i.department === user.department ||
              (i.additionalDepartments ?? []).includes(user.department)
            )
          : wardIssues;
        setIssues(filtered);
        setLoading(false);
        setSelected(prev => prev ? filtered.find(i => i.id === prev.id) ?? null : null);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user?.ward, user?.department]);

  // Location on mount
  useEffect(() => { requestLocation(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestLocation = () => {
    setLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      (err) => {
        console.warn(`Geolocation error (code ${err.code}):`, err.message);
        if (err.code === 1) {
          setLocationError("Location access denied. Open your browser settings and allow location for this site.");
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

  const handleUpdateStatus = async (issue: CivicIssue, status: CivicIssue["status"], resolvedImageUrl?: string, resolvedLat?: number, resolvedLng?: number) => {
    setUpdatingId(issue.id);
    try {
      await updateIssueStatus(issue.id, status);
      if (status === "in_progress" && user?.officerId) {
        await updateIssueFields(issue.id, { assignedOfficer: user.officerId });
      }
      if (status === "resolved") {
        if (user?.officerId) await incrementAuthorityResolvedCount(user.officerId);
        const extra: Record<string, unknown> = {};
        if (resolvedImageUrl) extra.resolvedImageUrl = resolvedImageUrl;
        if (resolvedLat !== undefined) extra.resolvedLat = resolvedLat;
        if (resolvedLng !== undefined) extra.resolvedLng = resolvedLng;
        if (Object.keys(extra).length) await updateIssueFields(issue.id, extra as any);
      }
      if (issue.userId) {
        const messages: Partial<Record<CivicIssue["status"], string>> = {
          in_progress: "Your issue is now being worked on by our team.",
          resolved: "Great news! Your reported issue has been resolved.",
          rejected: "Your issue report has been reviewed and marked as invalid.",
        };
        await createNotification({
          userId: issue.userId,
          type: status === "resolved" ? "resolution" : "issue_update",
          title: status === "resolved" ? "Issue Resolved!" : "Issue Status Updated",
          message: messages[status] || `Status changed to ${statusLabels[status]}.`,
          read: false,
          createdAt: new Date().toISOString(),
          issueId: issue.id,
        });
      }
      toast.success(`Issue marked as ${statusLabels[status]}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvePreview, setResolvePreview] = useState<string | null>(null);
  const [resolveUploading, setResolveUploading] = useState(false);
  const [resolveLocation, setResolveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [resolveLocating, setResolveLocating] = useState(false);
  const resolveFileRef = useRef<HTMLInputElement>(null);
  const [commentsIssue, setCommentsIssue] = useState<CivicIssue | null>(null);

  const openResolveDialog = () => {
    setResolvePreview(null);
    setResolveLocation(null);
    setResolveDialogOpen(true);
    // Capture GPS when dialog opens
    setResolveLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setResolveLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setResolveLocating(false); },
        () => setResolveLocating(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setResolveLocating(false);
    }
  };

  const handleResolveConfirm = async () => {
    if (!selected) return;
    if (!resolvePreview) {
      toast.error("Please take a photo of the resolved issue before confirming.");
      return;
    }
    setResolveUploading(true);
    try {
      const res = await fetch(resolvePreview);
      const blob = await res.blob();
      const url = await uploadToCloudinary(blob);
      await handleUpdateStatus(selected, "resolved", url, resolveLocation?.lat, resolveLocation?.lng);
      setResolveDialogOpen(false);
      setResolvePreview(null);
    } catch {
      toast.error("Photo upload failed. Try again.");
    } finally {
      setResolveUploading(false);
    }
  };

  const openInGoogleMaps = (issue: CivicIssue) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${issue.lat},${issue.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Reset expanded state when a new issue is selected
  const handleSelectIssue = (issue: CivicIssue) => {
    setSelected(issue);
    setSheetExpanded(false);
  };

  const filteredIssues = issues
    .filter(i => severityFilter === "all" || i.severity === severityFilter)
    .filter(i => statusFilter === "all" || i.status === statusFilter)
    .filter(i => categoryFilter === "all" || i.category === categoryFilter);

  const countBySeverity = (s: SeverityFilter) =>
    s === "all" ? issues.length : issues.filter(i => i.severity === s).length;

  const countByStatus = (s: StatusFilter) => {
    if (s === "all") return issues.length;
    return issues.filter(i => i.status === s).length;
  };

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "severe", label: "Severe" },
    { value: "medium", label: "Medium" },
    { value: "minor", label: "Minor" },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-nav relative overflow-hidden">
      {/* Map fills screen */}
      <div className="absolute inset-0 bottom-16">
        <IssueMap
          issues={filteredIssues}
          userLocation={userLocation}
          onSelectIssue={handleSelectIssue}
          severityFilter={severityFilter}
          panToUser={panToUser}
          center={userLocation ? [userLocation.lat, userLocation.lng] : [28.6139, 77.209]}
          zoom={14}
          className="h-full w-full"
        />
      </div>

      {/* ── Top Controls ── */}
      <div className="absolute top-0 left-0 right-0 z-[1001] pt-safe-header px-4 space-y-2 pointer-events-none">

        {/* Status toggle */}
        <div className="flex justify-center pointer-events-auto">
          <div className="flex items-center bg-card/95 backdrop-blur-md rounded-full p-1 shadow-xl border border-border">
            {(["all", "open", "in_progress", "resolved"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap",
                  statusFilter === s
                    ? s === "resolved" ? "bg-success text-success-foreground shadow"
                      : s === "open" ? "bg-destructive text-destructive-foreground shadow"
                      : s === "in_progress" ? "bg-warning text-warning-foreground shadow"
                      : "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s === "all" ? `All (${countByStatus("all")})`
                  : s === "in_progress" ? `In Progress (${countByStatus("in_progress")})`
                  : `${s.charAt(0).toUpperCase() + s.slice(1)} (${countByStatus(s)})`}
              </button>
            ))}
          </div>
        </div>

        {/* Severity chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pointer-events-auto">
          {severityOptions.map(({ value, label }) => {
            const count = countBySeverity(value);
            const active = severityFilter === value;
            const dotColor = value !== "all" ? severityColors[value as Severity] : undefined;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSeverityFilter(value)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border shadow-md transition-all whitespace-nowrap",
                  active
                    ? "bg-card text-foreground border-foreground/30 shadow-lg scale-105"
                    : "bg-card/85 backdrop-blur-sm text-muted-foreground border-border hover:bg-card"
                )}
              >
                {dotColor && (
                  <span className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0",
                    value === "severe" ? "bg-destructive" : value === "medium" ? "bg-warning" : "bg-success"
                  )} />
                )}
                {label}
                <span className={cn("font-bold", active ? "text-foreground" : "text-muted-foreground/60")}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 pointer-events-auto">
          {["all", ...issueCategories].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "flex-shrink-0 text-[10px] font-medium px-3 py-1.5 rounded-full border shadow-md transition-all whitespace-nowrap",
                categoryFilter === cat
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card/85 backdrop-blur-sm text-muted-foreground border-border hover:bg-card"
              )}
            >
              {cat === "all" ? `All Types` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Location error banner ── */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-44 left-4 right-4 z-[1002]"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2 shadow-lg backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive font-medium flex-1">{locationError}</p>
              <button
                type="button"
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

      {/* ── Locate me FAB ── */}
      <div className="absolute top-48 right-4 z-[1002]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => userLocation ? setPanToUser(c => c + 1) : requestLocation()}
          className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-sm shadow-xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
          title="Go to my location"
        >
          {locating
            ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
            : <Navigation className="w-4 h-4 text-primary" />
          }
        </motion.button>
      </div>

      {/* ── Stats bar ── */}
      {!loading && (
        <div className="absolute bottom-20 left-4 right-4 z-[1001] pointer-events-none">
          <div className="flex gap-2 justify-center">
            {[
              { color: severityColors.severe, label: "Severe", count: issues.filter(i => i.severity === "severe").length },
              { color: severityColors.medium, label: "Medium", count: issues.filter(i => i.severity === "medium").length },
              { color: severityColors.minor, label: "Minor", count: issues.filter(i => i.severity === "minor").length },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 border border-border shadow text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  s.label === "Severe" ? "bg-destructive" : s.label === "Medium" ? "bg-warning" : "bg-success"
                )} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Issue detail — Google Maps-style bottom sheet ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-16 left-0 right-0 z-[1002]"
          >
            <div className="bg-card rounded-t-3xl border-t border-x border-border shadow-2xl max-w-lg mx-auto overflow-hidden">
              {/* Drag handle + close */}
              <div
                className="flex items-center justify-between px-4 pt-3 pb-1 cursor-pointer select-none"
                onClick={() => setSheetExpanded(e => !e)}
              >
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                <div className="flex-1" />
                <button
                  type="button"
                  aria-label="Close"
                  onClick={(e) => { e.stopPropagation(); setSelected(null); setSheetExpanded(false); }}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Collapsed header — always visible */}
              <div
                className="px-4 pb-3 cursor-pointer"
                onClick={() => setSheetExpanded(e => !e)}
              >
                <div className="flex items-start gap-3">
                  {/* Severity dot */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5",
                    selected.severity === "severe" ? "bg-destructive/15" :
                    selected.severity === "medium" ? "bg-warning/15" : "bg-success/15"
                  )}>
                    <MapPin className={cn(
                      "w-5 h-5",
                      selected.severity === "severe" ? "text-destructive" :
                      selected.severity === "medium" ? "text-warning" : "text-success"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-1">{selected.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <SeverityBadge severity={selected.severity} size="sm" />
                      <Badge variant="outline" className="text-[10px] py-0">{selected.category}</Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] py-0",
                          selected.status === "resolved" ? "border-success/40 text-success bg-success/10" :
                          selected.status === "in_progress" ? "border-warning/40 text-warning bg-warning/10" :
                          selected.status === "rejected" ? "border-muted text-muted-foreground bg-muted/30" :
                          "border-destructive/40 text-destructive bg-destructive/10"
                        )}
                      >
                        {statusLabels[selected.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeDate(selected.reportedAt)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{selected.reportCount} report{selected.reportCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground mt-1">
                    {sheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {sheetExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-2 space-y-3">
                      {/* Photo */}
                      {selected.imageUrl && (
                        <div className="w-full h-44 rounded-2xl overflow-hidden border border-border">
                          <img src={selected.imageUrl} alt={selected.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-start gap-2 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-snug">{selected.location}</span>
                      </div>

                      {/* Department + Assigned */}
                      <div className="text-xs text-primary/80 font-medium">{selected.department}</div>
                      {selected.assignedOfficer && (
                        <div className="text-xs text-accent font-medium">Assigned to: {selected.assignedOfficer}</div>
                      )}

                      {/* Description */}
                      {selected.description && (
                        <p className="text-xs text-foreground/70 leading-relaxed italic border-l-2 border-border pl-3">
                          {selected.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons — always visible */}
              <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
                {/* Navigate + Comment row */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 gap-2"
                    onClick={() => openInGoogleMaps(selected)}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Navigate
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 text-muted-foreground"
                    onClick={() => setCommentsIssue(selected)}
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Comment
                  </Button>
                </div>

                {/* Status actions */}
                {updatingId === selected.id ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {selected.status === "open" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 text-xs gradient-primary text-primary-foreground"
                          onClick={() => handleUpdateStatus(selected, "in_progress")}
                        >
                          <Play className="w-3 h-3 mr-1" /> Start Work
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => handleUpdateStatus(selected, "rejected")}
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {selected.status === "in_progress" && (
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-success text-success-foreground hover:bg-success/90"
                        onClick={openResolveDialog}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                      </Button>
                    )}
                    {(selected.status === "resolved" || selected.status === "rejected") && (
                      <p className="text-xs text-muted-foreground text-center w-full py-1">
                        Issue is {selected.status}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Resolve with photo dialog ── */}
      <AnimatePresence>
        {resolveDialogOpen && selected && (
          <>
            <motion.div
              key="resolve-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
              onClick={() => setResolveDialogOpen(false)}
            />
            <motion.div
              key="resolve-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[2001] max-w-sm mx-auto"
            >
              <div className="bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Mark as Resolved</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{selected.title}</p>
                  </div>
                  <button type="button" aria-label="Cancel" onClick={() => setResolveDialogOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Location status */}
                <div className={cn(
                  "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                  resolveLocation ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}>
                  {resolveLocating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Getting your location…</>
                    : resolveLocation
                      ? <><Navigation2 className="w-3.5 h-3.5" /> Location captured</>
                      : <><Navigation2 className="w-3.5 h-3.5" /> Location unavailable</>
                  }
                </div>

                {selected.imageUrl && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Before (original)</p>
                    <img src={selected.imageUrl} alt="Before" className="w-full h-24 object-cover rounded-xl border border-border" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">After photo</p>
                    <span className="text-[10px] text-destructive font-medium">Required</span>
                  </div>
                  {resolvePreview ? (
                    <div className="relative">
                      <img src={resolvePreview} alt="After" className="w-full h-36 object-cover rounded-xl border border-success/40" />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => setResolvePreview(null)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-2 left-2 text-[9px] font-bold bg-success/80 text-white px-1.5 py-0.5 rounded-full">AFTER</div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resolveFileRef.current?.click()}
                      className="w-full h-28 rounded-xl border-2 border-dashed border-destructive/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Camera className="w-7 h-7" />
                      <span className="text-xs font-medium">Take / upload resolved photo</span>
                      <span className="text-[10px] text-destructive/70">Required to mark as resolved</span>
                    </button>
                  )}
                  <input
                    ref={resolveFileRef}
                    type="file"
                    accept="image/*"
                    aria-label="Upload resolved photo"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setResolvePreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setResolveDialogOpen(false)} disabled={resolveUploading}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className={cn("flex-1", resolvePreview ? "bg-success text-success-foreground hover:bg-success/90" : "opacity-50 bg-success text-success-foreground cursor-not-allowed")}
                    onClick={handleResolveConfirm}
                    disabled={resolveUploading || !resolvePreview}
                  >
                    {resolveUploading
                      ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading…</>
                      : <><CheckCircle className="w-3 h-3 mr-1" /> Confirm Resolved</>
                    }
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Comments sheet */}
      <CommentsSheet
        issueId={commentsIssue?.id ?? ""}
        issueTitle={commentsIssue?.title ?? ""}
        open={!!commentsIssue}
        onClose={() => setCommentsIssue(null)}
      />

      <BottomNav />
    </div>
  );
};

export default AuthorityMap;
