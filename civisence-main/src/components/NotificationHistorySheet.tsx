import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, CheckCircle2, AlertTriangle, FileText, Loader2, Trash2 } from "lucide-react";
import { getAllNotifications, clearNotifications } from "@/lib/firestore";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
}

const typeIcon = (type: string) => {
  if (type === "resolution") return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (type === "escalation") return <AlertTriangle className="w-4 h-4 text-warning" />;
  if (type === "new_issue") return <FileText className="w-4 h-4 text-primary" />;
  return <Bell className="w-4 h-4 text-muted-foreground" />;
};

const typeColor = (type: string) => {
  if (type === "resolution") return "bg-success/10 border-success/20";
  if (type === "escalation") return "bg-warning/10 border-warning/20";
  if (type === "new_issue") return "bg-primary/8 border-primary/15";
  return "bg-muted/50 border-border";
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-IN", { weekday: "long" });
  if (diffDays < 365) return d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

/** Group notifications by calendar day label */
const groupByDay = (notifs: AppNotification[]) => {
  const groups: { label: string; items: AppNotification[] }[] = [];
  notifs.forEach(n => {
    const label = formatDate(n.createdAt);
    const existing = groups.find(g => g.label === label);
    if (existing) existing.items.push(n);
    else groups.push({ label, items: [n] });
  });
  return groups;
};

const NotificationHistorySheet = ({ userId, open, onClose }: Props) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getAllNotifications(userId)
      .then(setNotifications)
      .catch(() => toast.error("Failed to load notification history"))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearNotifications(userId);
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch {
      toast.error("Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  const groups = groupByDay(notifications);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
            className="fixed inset-x-0 bottom-0 z-[201] bg-background rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "90dvh" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div>
                <h2 className="font-display font-bold text-base text-foreground">Notification History</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="flex items-center gap-1.5 text-xs text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 rounded-full font-medium disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    {clearing ? "Clearing…" : "Clear all"}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading history…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No notifications yet</p>
                  <p className="text-sm text-muted-foreground max-w-[220px]">
                    Notifications about your reports and updates will appear here.
                  </p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.items.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            "flex gap-3 p-3 rounded-xl border",
                            typeColor(n.type)
                          )}
                        >
                          <div className="shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border shadow-sm">
                            {typeIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(n.createdAt)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Safe bottom padding */}
            <div className="pb-safe-bottom shrink-0 h-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationHistorySheet;
