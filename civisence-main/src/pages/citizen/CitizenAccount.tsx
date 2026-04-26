import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, LogOut, FileText, CheckCircle, Users, Bell, ArrowLeft, Pencil, Loader2, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getIssuesByUser, updateUserProfile } from "@/lib/firestore";
import { CivicIssue } from "@/lib/types";
import NotificationHistorySheet from "@/components/NotificationHistorySheet";
import { toast } from "sonner";

const CitizenAccount = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [notifHistoryOpen, setNotifHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [form, setForm] = useState({ name: "", phone: "", city: "", ward: "" });

  useEffect(() => {
    if (user?.uid) getIssuesByUser(user.uid).then(setIssues).catch(() => {});
  }, [user]);

  const openEdit = () => {
    setForm({ name: user?.name || "", phone: user?.phone || "", city: user?.city || "", ward: user?.ward || "" });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), ward: form.ward.trim() });
      await refreshUser();
      setEditOpen(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setDark(isDark);
  };

  const stats = [
    { icon: FileText, label: "Reports", value: issues.length.toString() },
    { icon: CheckCircle, label: "Resolved", value: issues.filter(i => i.status === "resolved").length.toString() },
    { icon: Users, label: "Impact", value: issues.reduce((acc, i) => acc + i.reportCount, 0).toString() },
  ];

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pt-safe-header pb-10 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-primary-foreground">{user?.name}</h1>
            <p className="text-sm text-primary-foreground/70">Citizen</p>
          </div>
          <button onClick={openEdit} className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors">
            <Pencil className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-4 grid grid-cols-3 gap-2">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <s.icon className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="font-display font-bold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Profile Details</h3>
            <button onClick={openEdit} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
          {[
            { icon: Mail, label: "Email", value: user?.email },
            { icon: Phone, label: "Phone", value: user?.phone },
            { icon: MapPin, label: "City", value: user?.city || "New Delhi" },
            { icon: MapPin, label: "Ward", value: user?.ward || "5" },
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

        {/* Dark mode toggle */}
        <button onClick={toggleDark}
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 hover:bg-accent/50 transition-colors text-left">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {dark ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{dark ? "Light Mode" : "Dark Mode"}</p>
            <p className="text-xs text-muted-foreground">Switch appearance</p>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${dark ? "bg-primary" : "bg-muted"} flex items-center px-1`}>
            <motion.div animate={{ x: dark ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="w-4 h-4 rounded-full bg-white shadow" />
          </div>
        </button>

        {/* Notification History */}
        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => setNotifHistoryOpen(true)}
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 hover:bg-accent/50 transition-colors text-left">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Notification History</p>
            <p className="text-xs text-muted-foreground">View all past notifications</p>
          </div>
          <span className="text-muted-foreground text-lg leading-none">›</span>
        </motion.button>

        <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => { logout(); navigate("/login"); }}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Get Out
        </Button>
      </div>

      <BottomNav />

      {user?.uid && <NotificationHistorySheet userId={user.uid} open={notifHistoryOpen} onClose={() => setNotifHistoryOpen(false)} />}

      {/* Edit Profile Sheet */}
      <AnimatePresence>
        {editOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border p-6 space-y-4 max-h-[85dvh] overflow-y-auto">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
              <h2 className="font-display font-bold text-lg text-foreground">Edit Profile</h2>
              {[
                { label: "Full Name", key: "name", placeholder: "Your name", required: true },
                { label: "Phone Number", key: "phone", placeholder: "+91 XXXXX XXXXX" },
                { label: "City", key: "city", placeholder: "Your city" },
                { label: "Ward", key: "ward", placeholder: "Ward number" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label>{f.label}{f.required && " *"}</Label>
                  <Input placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} disabled={saving} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CitizenAccount;
