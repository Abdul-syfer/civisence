import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { CivicIssue } from "@/lib/types";
import { subscribeToIssuesByUser } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import StatusTimeline from "@/components/StatusTimeline";
import SeverityBadge from "@/components/SeverityBadge";
import { MapPin, ChevronDown, ChevronUp, Loader2, X, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import CommentsSheet from "@/components/CommentsSheet";

const statusLabels = { open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected" };
const statusStyles = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
};

/** Full-screen image lightbox */
const ImageLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <motion.div
    key="lightbox"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button
      type="button"
      aria-label="Close image"
      onClick={onClose}
      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
    >
      <X className="w-5 h-5" />
    </button>
    <motion.img
      src={src}
      alt={alt}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </motion.div>
);

const CitizenMyReports = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const [commentsIssue, setCommentsIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToIssuesByUser(user.uid, (myIssues) => {
      setIssues(myIssues);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const openLightbox = (src: string, alt: string) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
  };

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pt-safe-header pb-6 rounded-b-3xl">
        <h1 className="font-display text-xl font-bold text-primary-foreground">My Reports</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">{loading ? "..." : issues.length} issues reported</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">You haven't reported any issues yet.</p>
          </div>
        ) : (
          issues.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              {/* Photo section */}
              {(issue.imageUrl || issue.resolvedImageUrl) && (
                issue.status === "resolved" && issue.resolvedImageUrl ? (
                  /* Before / After side-by-side */
                  <div className="flex h-36">
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={issue.imageUrl}
                        alt="Before"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openLightbox(issue.imageUrl, `${issue.title} — Before`)}
                      />
                      <div className="absolute bottom-1.5 left-1.5 pointer-events-none">
                        <span className="text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-full">BEFORE</span>
                      </div>
                    </div>
                    <div className="w-px bg-border flex-shrink-0" />
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={issue.resolvedImageUrl}
                        alt="After"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openLightbox(issue.resolvedImageUrl!, `${issue.title} — After`)}
                      />
                      <div className="absolute bottom-1.5 left-1.5 pointer-events-none">
                        <span className="text-[9px] font-bold bg-success/80 text-white px-1.5 py-0.5 rounded-full">AFTER</span>
                      </div>
                    </div>
                  </div>
                ) : issue.imageUrl ? (
                  <img
                    src={issue.imageUrl}
                    alt={issue.title}
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => openLightbox(issue.imageUrl, issue.title)}
                  />
                ) : null
              )}

              {/* Card body */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={issue.severity} />
                        <Badge variant="outline" className={cn("text-[10px]", statusStyles[issue.status])}>
                          {statusLabels[issue.status]}
                        </Badge>
                      </div>
                      <h3 className="font-display font-semibold text-sm text-foreground">{issue.title}</h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{issue.location}</span>
                      </div>
                    </div>
                    {expanded === issue.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expanded === issue.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {issue.description && (
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                        )}
                        <StatusTimeline steps={issue.timeline} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comment button */}
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCommentsIssue(issue)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Comments
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Comments sheet */}
      {commentsIssue && (
        <CommentsSheet
          issueId={commentsIssue.id}
          issueTitle={commentsIssue.title}
          open={!!commentsIssue}
          onClose={() => setCommentsIssue(null)}
        />
      )}

      {/* Image lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <ImageLightbox
            src={lightboxSrc}
            alt={lightboxAlt}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default CitizenMyReports;
