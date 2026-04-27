import { useState, useEffect, useRef, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import { CivicIssue, issueCategories } from "@/lib/types";
import { subscribeToIssuesByWard, updateIssueStatus, updateIssueFields, createNotification, incrementAuthorityResolvedCount } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Play, CheckCircle, XCircle, Loader2, Camera, X, ImageIcon, MessageCircle, Navigation2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import CommentsSheet from "@/components/CommentsSheet";

const statusLabels: Record<CivicIssue["status"], string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected"
};
const statusStyles: Record<CivicIssue["status"], string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
};

/** Bottom-sheet dialog for authority to capture resolved photo + GPS */
const ResolvePhotoDialog = ({
  issue,
  onConfirm,
  onCancel,
}: {
  issue: CivicIssue;
  onConfirm: (resolvedImageUrl: string, lat?: number, lng?: number) => void;
  onCancel: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const res = await fetch(preview);
      const blob = await res.blob();
      const url = await uploadToCloudinary(blob);
      onConfirm(url, location?.lat, location?.lng);
    } catch {
      toast.error("Photo upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
        onClick={onCancel}
      />

      {/* Bottom Sheet */}
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="fixed bottom-0 inset-x-0 z-[2001] max-w-lg mx-auto flex flex-col"
      >
        <div className="bg-card rounded-t-3xl border-t border-x border-border shadow-2xl flex flex-col max-h-[88vh]">

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
            <div>
              <h3 className="font-semibold text-foreground">Mark as Resolved</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.title}</p>
            </div>
            <button
              type="button"
              aria-label="Cancel"
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

            {/* Location status */}
            <div className={cn(
              "flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl",
              location ? "bg-success/10 text-success" : locating ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
            )}>
              {locating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> Getting your location…</>
                : location
                  ? <><Navigation2 className="w-3.5 h-3.5 flex-shrink-0" /> Location captured · {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</>
                  : <><Navigation2 className="w-3.5 h-3.5 flex-shrink-0" /> Location unavailable — proceed anyway</>
              }
            </div>

            {/* Before photo — compact */}
            {issue.imageUrl && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Before (Original)</p>
                <img src={issue.imageUrl} alt="Before" className="w-full h-24 object-cover rounded-xl border border-border" />
              </div>
            )}

            {/* After photo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">After Photo</p>
                <span className="text-[10px] text-destructive font-semibold">Required</span>
              </div>

              {preview ? (
                <div className="relative">
                  <img src={preview} alt="After" className="w-full h-48 object-cover rounded-xl border-2 border-success/50" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setPreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 text-[9px] font-bold bg-success/80 text-white px-2 py-0.5 rounded-full">AFTER</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraFileRef.current?.click()}
                    className="h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-[11px] font-medium">Use Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="h-28 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[11px] font-medium">From Gallery</span>
                  </button>
                </div>
              )}

              {/* Camera capture input */}
              <input
                ref={cameraFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Capture photo with camera"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
              {/* Gallery / file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                aria-label="Upload resolved photo from gallery"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          </div>

          {/* Fixed action footer — always visible */}
          <div className="flex-shrink-0 px-5 pt-3 pb-6 border-t border-border bg-card">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1 font-semibold transition-all",
                  preview
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-success/40 text-success-foreground/60 cursor-not-allowed"
                )}
                onClick={handleConfirm}
                disabled={uploading || !preview}
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                  : <><CheckCircle className="w-4 h-4 mr-2" /> Confirm Resolved</>
                }
              </Button>
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
};

const AuthorityReports = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CivicIssue["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resolveTarget, setResolveTarget] = useState<CivicIssue | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [commentsIssue, setCommentsIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    if (!user?.ward) { setLoading(false); return; }
    const unsub = subscribeToIssuesByWard(
      user.ward,
      (wardIssues) => {
        setIssues(wardIssues.filter(i =>
          !i.isDuplicate &&
          (user.department
            ? i.department === user.department ||
              (i.additionalDepartments ?? []).includes(user.department)
            : true)
        ));
        setLoading(false);
      },
      (err) => {
        toast.error("Failed to load reports: " + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.ward, user?.department]);

  const displayed = issues
    .filter(i => statusFilter === "all" ? true : i.status === statusFilter)
    .filter(i => categoryFilter === "all" ? true : i.category === categoryFilter);

  const countByStatus = (s: CivicIssue["status"] | "all") =>
    s === "all" ? issues.length : issues.filter(i => i.status === s).length;

  const countByCategory = (cat: string) =>
    cat === "all"
      ? issues.filter(i => statusFilter === "all" || i.status === statusFilter).length
      : issues.filter(i => i.category === cat && (statusFilter === "all" || i.status === statusFilter)).length;

  const handleUpdateStatus = async (id: string, status: CivicIssue["status"], resolvedImageUrl?: string, resolvedLat?: number, resolvedLng?: number) => {
    setUpdatingId(id);
    try {
      await updateIssueStatus(id, status);

      if (status === "in_progress" && user?.officerId) {
        await updateIssueFields(id, { assignedOfficer: user.officerId });
      }

      if (status === "resolved") {
        if (user?.officerId) await incrementAuthorityResolvedCount(user.officerId);
        const extra: Record<string, unknown> = {};
        if (resolvedImageUrl) extra.resolvedImageUrl = resolvedImageUrl;
        if (resolvedLat !== undefined) extra.resolvedLat = resolvedLat;
        if (resolvedLng !== undefined) extra.resolvedLng = resolvedLng;
        if (Object.keys(extra).length) await updateIssueFields(id, extra as Partial<CivicIssue>);
      }

      toast.success(`Issue marked as ${statusLabels[status]}`);

      const updatedIssue = issues.find(i => i.id === id);
      if (updatedIssue?.userId) {
        const messages: Partial<Record<CivicIssue["status"], string>> = {
          in_progress: "Your issue is now being worked on by our team.",
          resolved: "Great news! Your reported issue has been resolved.",
          rejected: "Your issue report has been reviewed and marked as invalid.",
        };
        await createNotification({
          userId: updatedIssue.userId,
          type: status === "resolved" ? "resolution" : "issue_update",
          title: status === "resolved" ? "Issue Resolved!" : "Issue Status Updated",
          message: messages[status] || `Your issue status changed to ${statusLabels[status]}.`,
          read: false,
          createdAt: new Date().toISOString(),
          issueId: id,
        });
      }
    } catch (error) {
      console.error("Status update error", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = [
    { label: "Total", value: "all" as const, className: "bg-primary/10 text-primary" },
    { label: "Open", value: "open" as const, className: "bg-destructive/10 text-destructive" },
    { label: "In Progress", value: "in_progress" as const, className: "bg-warning/10 text-warning" },
    { label: "Resolved", value: "resolved" as const, className: "bg-success/10 text-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pb-6 rounded-b-3xl pt-safe-header">
        <h1 className="font-display text-xl font-bold text-primary-foreground">Reports Dashboard</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">{user?.ward} · {user?.department}</p>
      </div>

      <div className="px-5 mt-6">
        {/* Status filter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {statCards.map(s => (
            <motion.button
              key={s.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "rounded-xl p-3 text-center transition-all border-2",
                s.className,
                statusFilter === s.value ? "border-current shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <p className="font-display font-bold text-xl">{loading ? "-" : countByStatus(s.value)}</p>
              <p className="text-[10px] font-medium leading-tight">{s.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Category filter chips */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4 -mx-5 px-5">
            {["all", ...issueCategories].map(cat => {
              const count = countByCategory(cat);
              const active = categoryFilter === cat;
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "All Categories" : cat}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[10px] font-bold", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Active filter summary */}
        {(statusFilter !== "all" || categoryFilter !== "all") && !loading && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Showing:</span>
            {statusFilter !== "all" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
                {statusLabels[statusFilter]}
                <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setStatusFilter("all")}>×</button>
              </span>
            )}
            {categoryFilter !== "all" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
                {categoryFilter}
                <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setCategoryFilter("all")}>×</button>
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Issues list */}
        <AnimatePresence mode="wait">
          <motion.div key={`${statusFilter}-${categoryFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No issues match the selected filters.</p>
                <button
                  type="button"
                  className="text-xs text-primary underline mt-2"
                  onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((issue, i) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
                  >
                    {/* Issue photo */}
                    {(issue.imageUrl || issue.resolvedImageUrl) && (
                      issue.status === "resolved" && issue.resolvedImageUrl ? (
                        <div className="flex h-32">
                          <div className="relative flex-1 overflow-hidden">
                            <img src={issue.imageUrl} alt="Before" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">BEFORE</div>
                          </div>
                          <div className="w-px bg-border flex-shrink-0" />
                          <div className="relative flex-1 overflow-hidden">
                            <img src={issue.resolvedImageUrl} alt="After" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-success/80 text-white px-1.5 py-0.5 rounded-full">AFTER</div>
                          </div>
                        </div>
                      ) : issue.imageUrl ? (
                        <img src={issue.imageUrl} alt={issue.title} className="w-full h-28 object-cover" />
                      ) : null
                    )}

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <SeverityBadge severity={issue.severity} />
                            <Badge variant="outline" className={cn("text-[10px]", statusStyles[issue.status])}>
                              {statusLabels[issue.status]}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {issue.category}
                            </span>
                          </div>
                          <h3 className="font-display font-semibold text-sm text-foreground">{issue.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.location}</div>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{new Date(issue.reportedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1"><Users className="w-3 h-3" />{issue.reportCount}</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {updatingId === issue.id ? (
                          <div className="flex-1 flex justify-center py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 flex items-center gap-2">
                              {issue.status === "open" && (
                                <Button size="sm" className="text-xs h-7 flex-1 gradient-primary text-primary-foreground"
                                  onClick={() => handleUpdateStatus(issue.id, "in_progress")}>
                                  <Play className="w-3 h-3 mr-1" /> Start Working
                                </Button>
                              )}
                              {issue.status === "in_progress" && (
                                <Button size="sm" className="text-xs h-7 flex-1 bg-success text-success-foreground hover:bg-success/90"
                                  onClick={() => setResolveTarget(issue)}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                                </Button>
                              )}
                              {issue.status === "open" && (
                                <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive"
                                  onClick={() => handleUpdateStatus(issue.id, "rejected")}>
                                  <XCircle className="w-3 h-3 mr-1" /> Invalid
                                </Button>
                              )}
                              {(issue.status === "resolved" || issue.status === "rejected") && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
                                  {issue.status === "resolved"
                                    ? <><CheckCircle className="w-3.5 h-3.5 text-success" /> Resolved</>
                                    : <><XCircle className="w-3.5 h-3.5" /> Rejected</>
                                  }
                                  {issue.status === "resolved" && !issue.resolvedImageUrl && (
                                    <button
                                      type="button"
                                      className="ml-2 flex items-center gap-1 text-[10px] text-primary underline"
                                      onClick={() => setResolveTarget(issue)}
                                    >
                                      <ImageIcon className="w-3 h-3" /> Add photo
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Comment button */}
                            <button
                              type="button"
                              onClick={() => setCommentsIssue(issue)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-input rounded-md px-2 h-7 hover:bg-accent transition-colors flex-shrink-0"
                            >
                              <MessageCircle className="w-3 h-3" /> Comment
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Resolve photo bottom sheet */}
      <AnimatePresence>
        {resolveTarget && (
          <ResolvePhotoDialog
            issue={resolveTarget}
            onConfirm={async (resolvedImageUrl, lat, lng) => {
              const id = resolveTarget.id;
              const alreadyResolved = resolveTarget.status === "resolved";
              setResolveTarget(null);
              if (alreadyResolved) {
                const extra: Record<string, unknown> = { resolvedImageUrl };
                if (lat !== undefined) extra.resolvedLat = lat;
                if (lng !== undefined) extra.resolvedLng = lng;
                await updateIssueFields(id, extra as Partial<CivicIssue>);
                toast.success("Resolved photo saved!");
              } else {
                await handleUpdateStatus(id, "resolved", resolvedImageUrl, lat, lng);
              }
            }}
            onCancel={() => setResolveTarget(null)}
          />
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

export default AuthorityReports;
