import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Phone, Building2, MapPin, LogOut, Shield, Bell } from "lucide-react";
import { motion } from "framer-motion";
import NotificationHistorySheet from "@/components/NotificationHistorySheet";

const AuthorityAccount = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifHistoryOpen, setNotifHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pt-safe-header pb-10 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-primary-foreground">{user?.name}</h1>
            <p className="text-sm text-primary-foreground/70">Authority Officer</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Officer Details</h3>
          {[
            { icon: User, label: "Officer ID", value: user?.officerId },
            { icon: Building2, label: "Department", value: user?.department },
            { icon: MapPin, label: "Assigned Ward", value: `Ward ${user?.ward}` },
            { icon: Phone, label: "Phone", value: user?.phone },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-medium text-foreground">{item.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notification History */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setNotifHistoryOpen(true)}
          className="w-full mt-4 flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 hover:bg-accent/50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Notification History</p>
            <p className="text-xs text-muted-foreground">View all past notifications</p>
          </div>
          <span className="text-muted-foreground text-lg leading-none">›</span>
        </motion.button>

        <Button
          variant="outline"
          className="w-full mt-4 text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <BottomNav />

      {user?.uid && (
        <NotificationHistorySheet
          userId={user.uid}
          open={notifHistoryOpen}
          onClose={() => setNotifHistoryOpen(false)}
        />
      )}
    </div>
  );
};

export default AuthorityAccount;
