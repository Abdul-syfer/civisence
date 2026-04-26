import { MapPin, Clock, Users, MessageCircle, CheckCircle2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CivicIssue } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getIssueImage } from "@/lib/issueImages";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import SparkleButton from "@/components/SparkleButton";
import CommentsSheet from "@/components/CommentsSheet";
import BeforeAfterModal from "@/components/BeforeAfterModal";

/** Returns a compact human-readable relative time string */
const formatRelativeDate = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const severityConfig = {
  severe: { label: "Severe", className: "bg-destructive text-destructive-foreground" },
  medium: { label: "Medium", className: "severity-medium" },
  minor: { label: "Minor", className: "severity-minor" },
};

const statusConfig = {
  open: { label: "Open", className: "bg-destructive/10 text-destructive border-destructive/20" },
  in_progress: { label: "In Progress", className: "bg-warning/10 text-warning border-warning/20" },
  resolved: { label: "Resolved", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", className: "bg-muted text-muted-foreground" },
};

interface Props {
  issue: CivicIssue;
  onConfirm?: () => void;
  onClick?: () => void;
  showActions?: boolean;
  confirmLabel?: string;
}

/** Full-screen image lightbox */
const ImageLightbox = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => (
  <AnimatePresence>
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
  </AnimatePresence>
);

const IssueCard = ({ issue, onConfirm, onClick, showActions = true, confirmLabel }: Props) => {
  const sev = severityConfig[issue.severity];
  const stat = statusConfig[issue.status];
  const isResolved = issue.status === "resolved";
  const imageUrl = issue.imageUrl || getIssueImage(issue.category);
  const [confirmAnimating, setConfirmAnimating] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);
  const [beforeAfterStart, setBeforeAfterStart] = useState<0 | 1>(0);
  // For resolved cards: true = show AFTER (default), false = show BEFORE
  const [showAfter, setShowAfter] = useState(true);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmAnimating) return;
    setConfirmAnimating(true);
    onConfirm?.();
    setTimeout(() => setConfirmAnimating(false), 1000);
  };

  return (
    <>
      <motion.div
        onClick={onClick}
        className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        whileTap={{ scale: 0.98 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Issue Image */}
        <div className="relative overflow-hidden">
          {isResolved && issue.resolvedImageUrl ? (
            /* Single photo with left/right arrows — AFTER by default */
            <div className="relative h-40 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={showAfter ? "after" : "before"}
                  src={showAfter ? issue.resolvedImageUrl : imageUrl}
                  alt={showAfter ? "After" : "Before"}
                  initial={{ opacity: 0, x: showAfter ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: showAfter ? 30 : -30 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover absolute inset-0"
                  loading="lazy"
                />
              </AnimatePresence>

              {/* Label badge */}
              <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm",
                  showAfter ? "bg-emerald-500/80 text-white" : "bg-black/60 text-white"
                )}>
                  {showAfter ? "AFTER" : "BEFORE"}
                </span>
              </div>

              {/* Left arrow — go to BEFORE (only when showing AFTER) */}
              {showAfter && (
                <button
                  type="button"
                  aria-label="View before photo"
                  onClick={(e) => { e.stopPropagation(); setShowAfter(false); }}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Right arrow — go to AFTER (only when showing BEFORE) */}
              {!showAfter && (
                <button
                  type="button"
                  aria-label="View after photo"
                  onClick={(e) => { e.stopPropagation(); setShowAfter(true); }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Tap photo to open full swipe modal */}
              <button
                type="button"
                aria-label="View full comparison"
                onClick={(e) => { e.stopPropagation(); setBeforeAfterStart(showAfter ? 1 : 0); setBeforeAfterOpen(true); }}
                className="absolute inset-0 z-[5]"
              />
            </div>
          ) : (
            <div className="relative h-40">
              <img
                src={imageUrl}
                alt={issue.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Tap to open lightbox */}
              <button
                type="button"
                aria-label="View full image"
                onClick={(e) => { e.stopPropagation(); setLightboxSrc(imageUrl); }}
                className="absolute inset-0"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm", sev.className)}>
              {sev.label}
            </span>
            <Badge variant="outline" className={cn("text-[10px] backdrop-blur-sm bg-card/60", stat.className)}>
              {stat.label}
            </Badge>
          </div>
          <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none">
            <h3 className="font-display font-semibold text-sm text-foreground leading-tight drop-shadow-sm">{issue.title}</h3>
          </div>
        </div>

        <div className="p-3 pt-2">
          <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{issue.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeDate(issue.reportedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{issue.reportCount} reports</span>
              </div>
            </div>
            <div className="text-xs text-primary/80 font-medium">{issue.department}</div>

            {isResolved && (
              <div className="flex items-center gap-1.5 text-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved</span>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="flex-1">
                <SparkleButton
                  className={cn(
                    "text-xs h-8 w-full border bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3",
                    isResolved && "border-success/30 text-success hover:bg-success/10",
                    !isResolved && "border-input",
                    confirmAnimating && "ring-2 ring-primary/30"
                  )}
                  onClick={handleConfirm}
                >
                  {isResolved ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> {confirmLabel || "Confirm Resolved"}</>
                  ) : (
                    <><Users className="w-3 h-3 mr-1" /> {confirmLabel || "Confirm"}</>
                  )}
                </SparkleButton>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="text-xs h-8 hover:bg-accent hover:text-accent-foreground rounded-md px-3 inline-flex items-center gap-1 text-muted-foreground border border-input"
                onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
              >
                <MessageCircle className="w-3 h-3" />
                Comment
                {(issue.commentCount ?? 0) > 0 && (
                  <span className="ml-0.5 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {issue.commentCount}
                  </span>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Comments sheet */}
      <CommentsSheet
        issueId={issue.id}
        issueTitle={issue.title}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* Single-image lightbox (unsolved issues) */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={issue.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Before / After swipe modal (resolved issues) */}
      <AnimatePresence>
        {beforeAfterOpen && issue.resolvedImageUrl && (
          <BeforeAfterModal
            beforeUrl={imageUrl}
            afterUrl={issue.resolvedImageUrl}
            title={issue.title}
            initialSlide={beforeAfterStart}
            onClose={() => setBeforeAfterOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default IssueCard;
