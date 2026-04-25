import { useState, useEffect, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import { subscribeToNotifications, markNotificationRead, clearNotifications } from "@/lib/firestore";
import { AppNotification } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToNotifications(user.uid, setNotifications);
    return unsubscribe;
  }, [user?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const [clearing, setClearing] = useState(false);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      Promise.all(notifications.filter(n => !n.read).map(n => markNotificationRead(n.id)))
        .catch(console.error);
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
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
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
            className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-foreground">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex items-center gap-1 text-[11px] text-destructive hover:text-destructive/80 font-medium disabled:opacity-50 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                  {clearing ? "Clearing…" : "Clear all"}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      "px-4 py-3 border-b border-border last:border-0 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
