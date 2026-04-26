import { useState, useEffect, useRef } from "react";
import { Bell, Trash2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import { subscribeToNotifications, markNotificationRead, clearNotifications } from "@/lib/firestore";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeConfig = {
  resolution: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  escalation:  { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-500/10"  },
  new_issue:   { icon: FileText,      color: "text-primary",    bg: "bg-primary/10"    },
  default:     { icon: Bell,          color: "text-primary",    bg: "bg-primary/10"    },
};

function getConfig(type?: string) {
  if (type === "resolution") return typeConfig.resolution;
  if (type === "escalation")  return typeConfig.escalation;
  if (type === "new_issue")   return typeConfig.new_issue;
  return typeConfig.default;
}

function timeAgo(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToNotifications(user.uid, setNotifications);
  }, [user?.uid]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      Promise.all(notifications.filter(n => !n.read).map(n => markNotificationRead(n.id))).catch(console.error);
    }
  };

  const handleClear = async () => {
    if (!user?.uid || clearing) return;
    setClearing(true);
    try {
      await clearNotifications(user.uid);
      toast.success("Notifications cleared");
      setOpen(false);
    } catch {
      toast.error("Failed to clear notifications");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center relative"
        whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
        onClick={handleToggle}
      >
        <Bell className="w-5 h-5 text-primary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[min(360px,calc(100vw-2rem))] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{ maxHeight: "min(480px, 70vh)" }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button onClick={handleClear} disabled={clearing}
                  className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 font-medium disabled:opacity-50 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 show-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Bell className="w-8 h-8 opacity-20" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = getConfig(n.type);
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id}
                      className={cn(
                        "flex gap-3 px-4 py-3 border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40",
                        !n.read && "bg-primary/5"
                      )}>
                      {/* Icon */}
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                      {/* Unread dot */}
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
