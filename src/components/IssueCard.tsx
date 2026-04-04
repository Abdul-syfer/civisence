import { MapPin, Clock, Users, MessageCircle, CheckCircle2 } from "lucide-react";
import { CivicIssue } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getIssueImage } from "@/lib/issueImages";
import { motion } from "framer-motion";
import { useState } from "react";
import SparkleButton from "@/components/SparkleButton";

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

const IssueCard = ({ issue, onConfirm, onClick, showActions = true, confirmLabel }: Props) => {
  const sev = severityConfig[issue.severity];
  const stat = statusConfig[issue.status];
  const isResolved = issue.status === "resolved";
  const imageUrl = issue.imageUrl || getIssueImage(issue.category);
  const [confirmAnimating, setConfirmAnimating] = useState(false);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmAnimating) return; // Prevent multiple clicks while animating/processing
    
    setConfirmAnimating(true);
    onConfirm?.();
    
    // Reset animation state after a short delay
    setTimeout(() => setConfirmAnimating(false), 1000);
  };

  return (
    <motion.div
      onClick={onClick}
      className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Issue Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={issue.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm", sev.className)}>
            {sev.label}
          </span>
          <Badge variant="outline" className={cn("text-[10px] backdrop-blur-sm bg-card/60", stat.className)}>
            {stat.label}
          </Badge>
        </div>
        <div className="absolute bottom-2.5 left-3 right-3">
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
              className="text-xs h-8 hover:bg-accent hover:text-accent-foreground rounded-md px-3 inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="w-3 h-3 mr-1" /> Comment
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default IssueCard;
