import { cn } from "@/lib/utils";
import { Severity } from "@/lib/types";

const config = {
  severe: { label: "Severe", dot: "bg-destructive", bg: "bg-destructive/10 text-destructive" },
  medium: { label: "Medium", dot: "bg-warning", bg: "bg-warning/10 text-warning" },
  minor: { label: "Minor", dot: "bg-severity-minor", bg: "bg-severity-minor/10 text-severity-minor" },
};

const SeverityBadge = ({ severity, size = "sm" }: { severity: Severity; size?: "sm" | "md" }) => {
  const c = config[severity];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-medium", c.bg,
      size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse-dot", c.dot)} />
      {c.label}
    </span>
  );
};

export default SeverityBadge;
