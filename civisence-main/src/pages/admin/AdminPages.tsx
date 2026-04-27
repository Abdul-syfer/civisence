import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { departments, issueCategories, CivicIssue, Authority } from "@/lib/types";
import {
  subscribeToAllIssues, getAuthorities, createAuthority, updateAuthority, deleteAuthority,
  deleteIssue, updateIssueFields, createNotification, getUsersByWardAndRole, createUserProfile,
  saveSlaSettings
} from "@/lib/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as auth_instance } from "@/lib/firebase";
import { firebaseConfig } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import {
  BarChart3, Users, FileText, Building2, AlertTriangle, Settings,
  LogOut, Menu, X, Plus, Search, Shield, MapPin, Phone, Trash2, Edit, Eye,
  Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Save, Map, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import SeverityBadge from "@/components/SeverityBadge";
import { motion, AnimatePresence } from "framer-motion";
import WardPickerMap from "@/components/WardPickerMap";

const navItems = [
  { path: "/admin", icon: BarChart3, label: "Dashboard" },
  { path: "/admin/authorities", icon: Shield, label: "Authorities" },
  { path: "/admin/issues", icon: FileText, label: "Issues" },
  { path: "/admin/ward-map", icon: Map, label: "Ward Map" },
  { path: "/admin/departments", icon: Building2, label: "Departments" },
  { path: "/admin/escalations", icon: AlertTriangle, label: "Escalations" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <img src={logo} alt="CivicSense" className="w-9 h-9" />
          <div>
            <h1 className="font-display font-bold text-foreground text-sm">CivicSense</h1>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
          <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border space-y-1">
          <button
            type="button"
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/5 w-full transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Get Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
          <button type="button" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground flex-shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display font-semibold text-foreground truncate">
            {navItems.find(n => n.path === location.pathname)?.label || "Admin"}
          </h2>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllIssues((fetched) => {
      setIssues(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const dashStats = [
    { label: "Total Issues", value: issues.length, icon: FileText, color: "bg-primary/10 text-primary" },
    { label: "Open", value: issues.filter(i => i.status === "open").length, icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
    { label: "In Progress", value: issues.filter(i => i.status === "in_progress").length, icon: Clock, color: "bg-warning/10 text-warning" },
    { label: "Resolved", value: issues.filter(i => i.status === "resolved").length, icon: CheckCircle, color: "bg-success/10 text-success" },
  ];

  return (
    <AdminLayout>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("rounded-xl p-5 border border-border", s.color)}
          >
            <s.icon className="w-6 h-6 mb-2" />
            <p className="font-display text-2xl font-bold">{loading ? "-" : s.value}</p>
            <p className="text-xs font-medium opacity-80">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Issues</h3>
        <div className="space-y-3">
          {loading ? <p className="text-xs text-muted-foreground">Loading...</p> :
            issues.length === 0 ? <p className="text-xs text-muted-foreground">No issues found</p> :
              issues.slice(0, 6).map(issue => (
                <div key={issue.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={issue.severity} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">{issue.location}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{issue.status.replace("_", " ")}</Badge>
                </div>
              ))}
        </div>
      </div>
    </AdminLayout>
  );
};

// ─── Authorities ──────────────────────────────────────────────────────────────

// Create a Firebase Auth account using the REST API.
// This does NOT touch the current SDK session, so the admin stays logged in.
const createAuthAccount = async (email: string, password: string): Promise<string> => {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? "AUTH_ERROR";
    if (msg === "EMAIL_EXISTS") throw new Error("auth/email-already-in-use");
    if (msg === "INVALID_EMAIL") throw new Error("auth/invalid-email");
    if (msg === "WEAK_PASSWORD : Password should be at least 6 characters") throw new Error("auth/weak-password");
    throw new Error(msg);
  }
  return data.localId as string; // the new user's UID
};

const emptyAuthorityForm = {
  name: "", email: "", password: "", phone: "", officerId: "", ward: "", department: departments[0], city: "", areas: "",
};
const emptyEditForm = {
  name: "", phone: "", officerId: "", ward: "", department: departments[0], city: "", areas: "",
};

export const AdminAuthorities = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAuthorityForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWardPicker, setShowWardPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAuthorities();
        setAuthorities(fetched);
      } catch (e) {
        console.error("Authority fetch error", e);
        toast.error("Could not load authorities. Check Firestore rules.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreate = () => {
    setForm(emptyAuthorityForm);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (auth: Authority) => {
    setEditForm({ name: auth.name, phone: auth.phone, officerId: auth.officerId, ward: auth.ward, department: auth.department, city: auth.city ?? "", areas: auth.areas ?? "" });
    setEditId(auth.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyAuthorityForm);
    setEditForm(emptyEditForm);
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.officerId || !form.ward) {
      toast.error("Name, Email, Password, Officer ID and Ward are required.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      // Create Firebase Auth account via REST API (admin stays logged in)
      const newUid = await createAuthAccount(form.email, form.password);

      // Create the users/ profile so the officer can log in with the right role
      await createUserProfile(newUid, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: "authority",
        ward: form.ward,
        department: form.department,
        officerId: form.officerId,
        city: form.city,
        areas: form.areas,
      });

      // Create the authorities/ metadata entry linked by uid
      const newAuth = await createAuthority({
        uid: newUid,
        name: form.name,
        email: form.email,
        phone: form.phone,
        officerId: form.officerId,
        ward: form.ward,
        department: form.department,
        active: true,
        resolvedCount: 0,
        city: form.city,
        areas: form.areas,
      });

      setAuthorities(prev => [...prev, newAuth]);
      toast.success(
        `Account created! Email: ${form.email} · Password: ${form.password}`,
        { duration: 10000, description: "Save these credentials — the password won't be shown again." }
      );
      cancelForm();
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("email-already-in-use") || msg === "EMAIL_EXISTS") {
        toast.error("An account with this email already exists.");
      } else if (msg.includes("invalid-email") || msg === "INVALID_EMAIL") {
        toast.error("Invalid email address.");
      } else if (msg.includes("weak-password")) {
        toast.error("Password must be at least 6 characters.");
      } else {
        console.error("Create authority error:", err);
        toast.error(msg || "Operation failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editForm.name || !editForm.officerId || !editForm.ward) {
      toast.error("Name, Officer ID and Ward are required.");
      return;
    }
    setSaving(true);
    try {
      await updateAuthority(editId, {
        name: editForm.name, phone: editForm.phone,
        officerId: editForm.officerId, ward: editForm.ward, department: editForm.department,
        city: editForm.city, areas: editForm.areas,
      });
      // Keep users/ profile in sync
      const target = authorities.find(a => a.id === editId);
      if (target?.uid) {
        await createUserProfile(target.uid, {
          name: editForm.name, email: target.email ?? "", phone: editForm.phone,
          role: "authority", ward: editForm.ward, department: editForm.department, officerId: editForm.officerId,
          city: editForm.city, areas: editForm.areas,
        });
      }
      setAuthorities(prev => prev.map(a => a.id === editId ? { ...a, ...editForm } : a));
      toast.success("Authority updated!");
      cancelForm();
    } catch {
      toast.error("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string, currentActive: boolean) => {
    try {
      await updateAuthority(id, { active: !currentActive });
      setAuthorities(prev => prev.map(a => a.id === id ? { ...a, active: !currentActive } : a));
      toast.success(currentActive ? "Authority deactivated." : "Authority activated.");
    } catch {
      toast.error("Failed to update authority status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this authority permanently?")) return;
    try {
      const target = authorities.find(a => a.id === id);
      await deleteAuthority(id, target?.uid);
      setAuthorities(prev => prev.filter(a => a.id !== id));
      toast.success("Authority deleted.");
    } catch {
      toast.error("Failed to delete authority.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{loading ? "-" : authorities.length} officers</p>
        <Button size="sm" className="gradient-primary text-primary-foreground" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Authority
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3 overflow-hidden"
          >
            <h3 className="font-display font-semibold text-foreground">
              {editId ? "Edit Authority" : "Create Authority Account"}
            </h3>

            {editId ? (
              /* ── Edit form (no email/password) ── */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="Full Name *" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="Phone Number" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input placeholder="Officer ID *" value={editForm.officerId} onChange={e => setEditForm(f => ({ ...f, officerId: e.target.value }))} />
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Ward *" value={editForm.ward} onChange={e => setEditForm(f => ({ ...f, ward: e.target.value }))} />
                    <button type="button" title="Pick ward from map" onClick={() => setShowWardPicker(v => !v)}
                      className="flex-shrink-0 p-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors">
                      <MapPin className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                {showWardPicker && (
                  <WardPickerMap onWardPicked={ward => { setEditForm(f => ({ ...f, ward })); setShowWardPicker(false); }} />
                )}
                <select aria-label="Department" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="City (e.g. Mumbai)" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                  <Input placeholder="Areas covered (e.g. Andheri, Bandra, Kurla)" value={editForm.areas} onChange={e => setEditForm(f => ({ ...f, areas: e.target.value }))} />
                </div>
              </>
            ) : (
              /* ── Create form (with email + password for Auth account) ── */
              <>
                <p className="text-xs text-muted-foreground">
                  This creates a login account the officer can use immediately.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  <Input placeholder="Email (login) *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  <Input placeholder="Password (min 6 chars) *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <Input placeholder="Officer ID (e.g. RM-W5-1024) *" value={form.officerId} onChange={e => setForm(f => ({ ...f, officerId: e.target.value }))} />
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Ward *" value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
                    <button type="button" title="Pick ward from map" onClick={() => setShowWardPicker(v => !v)}
                      className="flex-shrink-0 p-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors">
                      <MapPin className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                {showWardPicker && (
                  <WardPickerMap onWardPicked={ward => { setForm(f => ({ ...f, ward })); setShowWardPicker(false); }} />
                )}
                <select aria-label="Department" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="City (e.g. Mumbai)" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  <Input placeholder="Areas covered (e.g. Andheri, Bandra, Kurla)" value={form.areas} onChange={e => setForm(f => ({ ...f, areas: e.target.value }))} />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button className="gradient-primary text-primary-foreground" onClick={editId ? handleUpdate : handleCreate} disabled={saving}>
                <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : editId ? "Update" : "Create Account"}
              </Button>
              <Button variant="ghost" onClick={cancelForm}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading authorities...</p> :
          authorities.length === 0 ? <p className="text-sm text-muted-foreground">No authorities added yet.</p> :
            authorities.map(auth => (
              <div key={auth.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-display font-semibold text-foreground">{auth.name}</h4>
                    <p className="text-xs text-muted-foreground">{auth.department}</p>
                    {auth.email && <p className="text-xs text-muted-foreground">{auth.email}</p>}
                  </div>
                  <Badge variant={auth.active ? "default" : "outline"} className="text-[10px]">
                    {auth.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Shield className="w-3 h-3" />{auth.officerId}</div>
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />Ward {auth.ward}</div>
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{auth.phone}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(auth)}>
                    <Edit className="w-3 h-3 mr-1" />Edit
                  </Button>
                  {auth.email && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
                      try {
                        await sendPasswordResetEmail(auth_instance, auth.email!);
                        toast.success(`Reset email sent to ${auth.email}`);
                      } catch { toast.error("Failed to send reset email."); }
                    }}>
                      Reset Password
                    </Button>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    className={cn("text-xs h-7", auth.active ? "text-destructive" : "text-success")}
                    onClick={() => handleDeactivate(auth.id, auth.active)}
                  >
                    {auth.active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive ml-auto" onClick={() => handleDelete(auth.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-accent font-medium">{auth.resolvedCount} resolved</span>
                </div>
              </div>
            ))}
      </div>
    </AdminLayout>
  );
};

// ─── Issues ───────────────────────────────────────────────────────────────────
export const AdminIssues = () => {
  const [search, setSearch] = useState("");
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [allAuthorities, setAllAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllIssues((fetched) => {
      setIssues(fetched.filter(i => !i.isDuplicate));
      setLoading(false);
    });
    getAuthorities().then(setAllAuthorities).catch(() => {});
    return () => unsub();
  }, []);

  const filtered = issues.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this issue permanently?")) return;
    try {
      await deleteIssue(id);
      setIssues(prev => prev.filter(i => i.id !== id));
      if (viewId === id) setViewId(null);
      toast.success("Issue deleted.");
    } catch {
      toast.error("Failed to delete issue.");
    }
  };

  const handleStatusChange = async (id: string, status: CivicIssue["status"]) => {
    try {
      await updateIssueFields(id, { status });
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search issues..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading issues...</p> :
          filtered.length === 0 ? <p className="text-sm text-muted-foreground">No issues found.</p> :
            filtered.map(issue => (
              <div key={issue.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={issue.severity} />
                      <Badge variant="outline" className="text-[10px]">{issue.status.replace("_", " ")}</Badge>
                    </div>
                    <h4 className="font-display font-semibold text-sm text-foreground">{issue.title}</h4>
                    <p className="text-xs text-muted-foreground">{issue.location} · {issue.reportCount} reports</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm" variant="ghost" className="h-8 w-8 p-0"
                      onClick={() => setViewId(viewId === issue.id ? null : issue.id)}
                    >
                      {viewId === issue.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDelete(issue.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {viewId === issue.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden"
                    >
                      <div className="p-4 space-y-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="font-medium text-foreground">Ward:</span> {issue.ward}</div>
                          <div><span className="font-medium text-foreground">Dept:</span> {issue.department}</div>
                          <div><span className="font-medium text-foreground">Reported:</span> {new Date(issue.reportedAt).toLocaleDateString()}</div>
                          <div><span className="font-medium text-foreground">Category:</span> {issue.category}</div>
                        </div>
                        {/* Responsible authority */}
                        {(() => {
                          const officer = allAuthorities.find(a => a.ward === issue.ward && a.department === issue.department);
                          return (
                            <div className={cn("flex items-center gap-2 p-2 rounded-lg text-xs", officer ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                              <Shield className="w-3 h-3 flex-shrink-0" />
                              {officer
                                ? <span><span className="font-semibold">{officer.name}</span> ({officer.officerId}) — {officer.active ? "Active" : "Inactive"}</span>
                                : <span>No officer assigned for {issue.department} in Ward {issue.ward}</span>}
                            </div>
                          );
                        })()}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">Change status:</span>
                          <select
                            aria-label="Change issue status"
                            className="text-xs rounded border border-border bg-background px-2 py-1"
                            value={issue.status}
                            onChange={e => handleStatusChange(issue.id, e.target.value as CivicIssue["status"])}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
      </div>
    </AdminLayout>
  );
};

// ─── Departments ──────────────────────────────────────────────────────────────
export const AdminDepartments = () => {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    getAuthorities().then(setAuthorities).catch(() => { });
    const unsub = subscribeToAllIssues((all) => setIssues(all.filter(i => !i.isDuplicate)));
    return () => unsub();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-3">
        {departments.map((dept, i) => {
          const deptAuthorities = authorities.filter(a => a.department === dept);
          const deptIssues = issues.filter(i => i.department === dept && i.status !== "resolved");
          const isExpanded = expandedDept === dept;
          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <button
                type="button"
                className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                onClick={() => setExpandedDept(isExpanded ? null : dept)}
              >
                <div>
                  <h4 className="font-display font-semibold text-foreground">{dept}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {deptAuthorities.length} officer{deptAuthorities.length !== 1 ? "s" : ""} · {deptIssues.length} open issue{deptIssues.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border overflow-hidden"
                  >
                    <div className="p-4 space-y-4 bg-muted/20">
                      {/* Officers */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Officers</p>
                        {deptAuthorities.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No officers assigned to this department.</p>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {deptAuthorities.map(a => (
                              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
                                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{a.officerId} · Ward {a.ward}</p>
                                </div>
                                <Badge variant={a.active ? "default" : "outline"} className="text-[10px] ml-auto flex-shrink-0">
                                  {a.active ? "Active" : "Off"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Open Issues */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Open Issues</p>
                        {deptIssues.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No open issues for this department.</p>
                        ) : (
                          <div className="space-y-2">
                            {deptIssues.slice(0, 5).map(issue => {
                              const officer = deptAuthorities.find(a => a.ward === issue.ward);
                              return (
                                <div key={issue.id} className="flex items-start gap-3 p-2 rounded-lg bg-card border border-border">
                                  <SeverityBadge severity={issue.severity} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">{issue.title}</p>
                                    <p className="text-[10px] text-muted-foreground">Ward {issue.ward} · {issue.reportCount} report{issue.reportCount !== 1 ? "s" : ""}</p>
                                    <p className="text-[10px] text-primary mt-0.5">
                                      {officer ? `→ ${officer.name} (${officer.officerId})` : "→ No officer assigned"}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] flex-shrink-0">{issue.status.replace("_", " ")}</Badge>
                                </div>
                              );
                            })}
                            {deptIssues.length > 5 && (
                              <p className="text-[10px] text-muted-foreground text-center">+{deptIssues.length - 5} more issues</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

// ─── Escalations ──────────────────────────────────────────────────────────────
export const AdminEscalations = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeToAllIssues((all) => {
      const candidates = all.filter(i => i.status === "open" || i.status === "in_progress");
      setIssues(candidates);
      setEscalatedIds(new Set(candidates.filter(i => i.escalated).map(i => i.id)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEscalate = async (issue: CivicIssue) => {
    try {
      await updateIssueFields(issue.id, { escalated: true });
      setEscalatedIds(prev => new Set([...prev, issue.id]));

      const now = new Date().toISOString();

      // Notify the citizen who reported the issue
      if (issue.userId) {
        await createNotification({
          userId: issue.userId,
          type: "escalation",
          title: "Issue Escalated",
          message: `Your issue "${issue.title}" has been escalated to a supervisor for urgent attention.`,
          read: false,
          createdAt: now,
          issueId: issue.id,
        });
      }

      // Also notify ward authority users so they know this is urgent
      if (issue.ward) {
        try {
          const wardAuthorities = await getUsersByWardAndRole(issue.ward, "authority");
          await Promise.all(wardAuthorities.map(authority =>
            createNotification({
              userId: authority.uid,
              type: "escalation",
              title: "Issue Escalated — Urgent",
              message: `Admin has escalated "${issue.title}" in Ward ${issue.ward}. Immediate action required.`,
              read: false,
              createdAt: now,
              issueId: issue.id,
            })
          ));
        } catch (notifErr) {
          console.error("Failed to notify ward authorities on escalation:", notifErr);
        }
      }

      toast.success("Issue escalated to supervisor.");
    } catch {
      toast.error("Failed to escalate issue.");
    }
  };

  const handleRemind = async (issue: CivicIssue) => {
    try {
      if (issue.userId) {
        await createNotification({
          userId: issue.userId,
          type: "reminder",
          title: "Issue Reminder",
          message: `We're still working on your issue: "${issue.title}". Thank you for your patience.`,
          read: false,
          createdAt: new Date().toISOString(),
          issueId: issue.id,
        });
      }
      toast.success("Reminder sent to reporter.");
    } catch {
      toast.error("Failed to send reminder.");
    }
  };

  return (
    <AdminLayout>
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-medium text-destructive">
            {loading ? "-" : issues.length} issues may need escalation
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> :
          issues.length === 0 ? <p className="text-sm text-muted-foreground">No escalations required.</p> :
            issues.map(issue => (
              <div key={issue.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={issue.severity} />
                      {escalatedIds.has(issue.id) ? (
                        <span className="text-xs text-warning font-medium">⬆ Escalated</span>
                      ) : (
                        <span className="text-xs text-destructive font-medium">⏰ Pending</span>
                      )}
                    </div>
                    <h4 className="font-display font-semibold text-sm text-foreground">{issue.title}</h4>
                    <p className="text-xs text-muted-foreground">{issue.location}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm" variant="outline" className="text-xs h-7"
                      disabled={escalatedIds.has(issue.id)}
                      onClick={() => handleEscalate(issue)}
                    >
                      {escalatedIds.has(issue.id) ? "Escalated" : "Escalate"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleRemind(issue)}>
                      Remind
                    </Button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </AdminLayout>
  );
};

// ─── Settings ─────────────────────────────────────────────────────────────────
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const AdminSettings = () => {
  const [categories, setCategories] = useState<string[]>(() =>
    loadFromStorage("civicsense_categories", issueCategories)
  );
  const [newCategory, setNewCategory] = useState("");
  const [sla, setSla] = useState<Record<string, number>>(() =>
    loadFromStorage("civicsense_sla", Object.fromEntries(issueCategories.map(c => [c, 3])))
  );
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() =>
    loadFromStorage("civicsense_notif_enabled", true)
  );
  const [mapClustering, setMapClustering] = useState<boolean>(() =>
    loadFromStorage("civicsense_map_clustering", true)
  );

  const saveCategories = () => {
    localStorage.setItem("civicsense_categories", JSON.stringify(categories));
    toast.success("Categories saved.");
  };

  const saveSla = async () => {
    try {
      await saveSlaSettings(sla);
      localStorage.setItem("civicsense_sla", JSON.stringify(sla));
      toast.success("SLA deadlines saved.");
    } catch {
      toast.error("Failed to save SLA settings. Please try again.");
    }
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) { toast.info("Category already exists."); return; }
    setCategories(prev => [...prev, trimmed]);
    setNewCategory("");
  };

  const removeCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const toggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem("civicsense_notif_enabled", JSON.stringify(next));
    toast.success(`Notifications ${next ? "enabled" : "disabled"}.`);
  };

  const toggleClustering = () => {
    const next = !mapClustering;
    setMapClustering(next);
    localStorage.setItem("civicsense_map_clustering", JSON.stringify(next));
    toast.success(`Map clustering ${next ? "enabled" : "disabled"}.`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">

        {/* Issue Categories */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-display font-semibold text-foreground mb-1">Issue Categories</h4>
          <p className="text-xs text-muted-foreground mb-4">Manage the list of civic issue categories</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-1 bg-muted text-foreground text-xs px-2.5 py-1 rounded-full">
                {cat}
                <button type="button" aria-label={`Remove ${cat}`} onClick={() => removeCategory(cat)} className="text-muted-foreground hover:text-destructive ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New category..."
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCategory()}
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={addCategory}><Plus className="w-3 h-3" /></Button>
          </div>
          <Button size="sm" className="gradient-primary text-primary-foreground mt-3" onClick={saveCategories}>
            <Save className="w-3 h-3 mr-1" /> Save Categories
          </Button>
        </div>

        {/* SLA Deadlines */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="font-display font-semibold text-foreground mb-1">SLA Deadlines</h4>
          <p className="text-xs text-muted-foreground mb-4">Set days before issue becomes public to citizens. <span className="font-semibold text-foreground">0 = visible immediately at time of report.</span></p>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{cat}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0} max={30}
                    value={sla[cat] ?? 3}
                    onChange={e => setSla(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                    className="w-16 text-xs h-7"
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" className="gradient-primary text-primary-foreground mt-4" onClick={saveSla}>
            <Save className="w-3 h-3 mr-1" /> Save SLA
          </Button>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-semibold text-foreground">Notification Settings</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Enable push notifications and alerts</p>
            </div>
            <Switch
              checked={notifEnabled}
              onCheckedChange={checked => { setNotifEnabled(checked); localStorage.setItem("civicsense_notif_enabled", JSON.stringify(checked)); toast.success(`Notifications ${checked ? "enabled" : "disabled"}.`); }}
              aria-label="Toggle notifications"
            />
          </div>
        </div>

        {/* Map Settings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display font-semibold text-foreground">Map Clustering</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Group nearby issue markers on the map</p>
            </div>
            <Switch
              checked={mapClustering}
              onCheckedChange={checked => { setMapClustering(checked); localStorage.setItem("civicsense_map_clustering", JSON.stringify(checked)); toast.success(`Map clustering ${checked ? "enabled" : "disabled"}.`); }}
              aria-label="Toggle map clustering"
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
