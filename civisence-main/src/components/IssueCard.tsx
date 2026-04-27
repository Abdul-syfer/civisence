import { MapPin, Clock, Users, MessageCircle, CheckCircle2, X, ChevronLeft, ChevronRight, Flame, Zap, Leaf } from "lucide-react";
import { CivicIssue } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getIssueImage } from "@/lib/issueImages";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import SparkleButton from "@/components/SparkleButton";
import CommentsSheet from "@/components/CommentsSheet";
import BeforeAfterModal from "@/components/BeforeAfterModal";

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

const categoryAvatarColors: Record<string, string> = {
  "Pothole": "bg-orange-500",
  "Accident": "bg-red-600",
  "Garbage Overflow": "bg-lime-600",
  "Drainage Overflow": "bg-blue-600",
  "Water Leakage": "bg-cyan-500",
  "Electric Cable Issue": "bg-yellow-500",
  "Streetlight Damage": "bg-purple-500",
  "Ambulance Blockage": "bg-rose-600",
};

const severityIcon = {
  severe: <Flame className="w-3 h-3" />,
  medium: <Zap className="w-3 h-3" />,
  minor: <Leaf className="w-3 h-3" />,
};

const severityStyle = {
  severe: "bg-red-500/15 text-red-600 border-red-200",
  medium: "bg-amber-500/15 text-amber-600 border-amber-200",
  minor: "bg-emerald-500/15 text-emerald-600 border-emerald-200",
};

const statusStyle = {
  open: "bg-red-500/10 text-red-600",
  in_progress: "bg-amber-500/10 text-amber-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-gray-200 text-gray-500",
};

const statusLabel = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

interface Props {
  issue: CivicIssue;
  onConfirm?: () => void;
  onClick?: () => void;
  showActions?: boolean;
  showSeverity?: boolean;
  confirmLabel?: string;
}

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
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  </AnimatePresence>
);

const IssueCard = ({ issue, onConfirm, onClick, showActions = true, showSeverity = true, confirmLabel }: Props) => {
  const isResolved = issue.status === "resolved";
  const imageUrl = issue.imageUrl || getIssueImage(issue.category);
  const [confirmAnimating, setConfirmAnimating] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [beforeAfterOpen, setBeforeAfterOpen] = useState(false);
  const [beforeAfterStart, setBeforeAfterStart] = useState<0 | 1>(0);
  // 0 = BEFORE, 1 = AFTER (default for resolved)
  const [slide, setSlide] = useState<0 | 1>(isResolved && issue.resolvedImageUrl ? 1 : 0);

  const totalSlides = isResolved && issue.resolvedImageUrl ? 2 : 1;

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmAnimating) return;
    setConfirmAnimating(true);
    onConfirm?.();
    setTimeout(() => setConfirmAnimating(false), 1000);
  };

  const avatarColor = categoryAvatarColors[issue.category] ?? "bg-primary";
  const initials = issue.category.slice(0, 2).toUpperCase();

  return (
    <>
      <motion.div
        onClick={onClick}
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm cursor-pointer"
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* ── Instagram-style header ── */}
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          {/* Avatar */}
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ring-2 ring-offset-1 ring-border", avatarColor)}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-none truncate">{issue.category}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{issue.location}</span>
            </div>
          </div>
          {/* Status pill */}
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", statusStyle[issue.status])}>
            {statusLabel[issue.status]}
          </span>
        </div>

        {/* ── Full-bleed image ── */}
        <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
          {totalSlides === 2 ? (
            <>
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={slide}
                  src={slide === 1 ? issue.resolvedImageUrl! : imageUrl}
                  alt={slide === 1 ? "After fix" : "Before fix"}
                  initial={{ opacity: 0, x: slide === 1 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slide === 1 ? -40 : 40 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </AnimatePresence>

              {/* BEFORE/AFTER label */}
              <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow",
                  slide === 1 ? "bg-emerald-500/90 text-white" : "bg-black/60 text-white"
                )}>
                  {slide === 1 ? "AFTER" : "BEFORE"}
                </span>
              </div>

              {/* Arrow navigation */}
              {slide === 1 && (
                <button
                  type="button"
                  aria-label="View before"
                  onClick={(e) => { e.stopPropagation(); setSlide(0); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
              )}
              {slide === 0 && (
                <button
                  type="button"
                  aria-label="View after"
                  onClick={(e) => { e.stopPropagation(); setSlide(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20 hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              )}

              {/* Instagram-style dot indicators */}
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === slide ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>

              {/* Tap to open modal */}
              <button
                type="button"
                aria-label="View full comparison"
                onClick={(e) => { e.stopPropagation(); setBeforeAfterStart(slide as 0 | 1); setBeforeAfterOpen(true); }}
                className="absolute inset-0 z-[5]"
              />
            </>
          ) : (
            <>
              <img
                src={imageUrl}
                alt={issue.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                aria-label="View full image"
                onClick={(e) => { e.stopPropagation(); setLightboxSrc(imageUrl); }}
                className="absolute inset-0"
              />
            </>
          )}
        </div>

        {/* ── Action bar ── */}
        {showActions && (
          <div className="flex items-center gap-3 px-3.5 pt-3 pb-1">
            <SparkleButton
              className={cn(
                "flex items-center gap-1.5 text-[13px] font-semibold px-0 bg-transparent border-none shadow-none hover:bg-transparent",
                isResolved ? "text-emerald-600" : "text-foreground hover:text-primary",
                confirmAnimating && "text-primary"
              )}
              onClick={handleConfirm}
            >
              {isResolved
                ? <><CheckCircle2 className="w-5 h-5" /><span>{confirmLabel || "Confirm Resolved"}</span></>
                : <><Users className="w-5 h-5" /><span>{confirmLabel || "Confirm"}</span></>
              }
            </SparkleButton>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-primary ml-1 bg-transparent border-none"
              onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
            >
              <MessageCircle className="w-5 h-5" />
              {(issue.commentCount ?? 0) > 0 && <span>{issue.commentCount}</span>}
            </motion.button>

            <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{issue.reportCount} reports</span>
            </div>
          </div>
        )}

        {/* ── Caption area ── */}
        <div className="px-3.5 pb-3 pt-1 space-y-1.5">
          <p className="text-[13px] leading-snug">
            <span className="font-semibold text-foreground">{issue.category} </span>
            <span className="text-muted-foreground">{issue.title}</span>
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity badge */}
            {showSeverity && (
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", severityStyle[issue.severity])}>
                {severityIcon[issue.severity]}
                {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
              </span>
            )}

            {/* Department */}
            <span className="text-[10px] text-primary/80 font-medium bg-primary/8 px-2 py-0.5 rounded-full truncate max-w-[160px]">
              {issue.department}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeDate(issue.reportedAt)}</span>
          </div>
        </div>
      </motion.div>

      <CommentsSheet
        issueId={issue.id}
        issueTitle={issue.title}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={issue.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}

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
