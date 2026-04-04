import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { departments, issueCategories, CivicIssue, Authority } from "@/lib/types";
import {
  getAllIssues, getAuthorities, createAuthority, updateAuthority, deleteAuthority,
  deleteIssue, updateIssueFields, createNotification
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";
import {
  BarChart3, Users, FileText, Building2, AlertTriangle, Settings,
  LogOut, Menu, X, Plus, Search, Shield, MapPin, Phone, Trash2, Edit, Eye,
  Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SeverityBadge from "@/components/SeverityBadge";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/admin", icon: BarChart3, label: "Dashboard" },
  { path: "/admin/authorities", icon: Shield, label: "Authorities" },
  { path: "/admin/issues", icon: FileText, label: "Issues" },
  { path: "/admin/departments", icon: Building2, label: "Departments" },
  { path: "/admin/escalations", icon: AlertTriangle, label: "Escalations" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
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
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-muted-foreground">
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
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/5 w-full transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-lg border-b border-border px-5 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-display font-semibold text-foreground flex-1">
            {navItems.find(n => n.path === location.pathname)?.label || "Admin"}
          </h2>
        </header>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAllIssues();
        setIssues(fetched);
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
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
const emptyAuthorityForm = { name: "", phone: "", officerId: "", ward: "", department: departments[0] };

export const AdminAuthorities = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAuthorityForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAuthorities();
        setAuthorities(fetched);
      } catch (e) {
        console.error("Authority fetch error", e);
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
    setForm({ name: auth.name, phone: auth.phone, officerId: auth.officerId, ward: auth.ward, department: auth.department });
    setEditId(auth.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.officerId || !form.ward || !form.department) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateAuthority(editId, { name: form.name, phone: form.phone, officerId: form.officerId, ward: form.ward, department: form.department });
        setAuthorities(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a));
        toast.success("Authority updated!");
      } else {
        const newAuth = await createAuthority({ ...form, active: true, resolvedCount: 0 });
        setAuthorities(prev => [...prev, newAuth]);
        toast.success("Authority created!");
      }
      setForm(emptyAuthorityForm);
      setEditId(null);
      setShowForm(false);
    } catch {
      toast.error("Operation failed. Please try again.");
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
      await deleteAuthority(id);
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
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input placeholder="Officer ID (e.g. RM-W5-1024) *" value={form.officerId} onChange={e => setForm(f => ({ ...f, officerId: e.target.value }))} />
              <Input placeholder="Ward Number *" value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))} />
            </div>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            >
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
            <div className="flex gap-2">
              <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={saving}>
                <Save className="w-3 h-3 mr-1" /> {saving ? "Saving..." : editId ? "Update" : "Create"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyAuthorityForm); }}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading authorities...</p> :
          authorities.length === 0 ? <p className="text-sm text-muted-foreground">No authorities added yet.</p> :
            authorities.map(auth => (
              <div key={auth.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-display font-semibold text-foreground">{auth.name}</h4>
                    <p className="text-xs text-muted-foreground">{auth.department}</p>
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
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(auth)}>
                    <Edit className="w-3 h-3 mr-1" />Edit
                  </Button>
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
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAllIssues();
        setIssues(fetched);
      } catch (e) {
        console.error("Issues fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">Change status:</span>
                          <select
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
  useEffect(() => {
    getAuthorities().then(setAuthorities).catch(() => { });
  }, []);

  return (
    <AdminLayout>
      <div className="grid lg:grid-cols-2 gap-4">
        {departments.map((dept, i) => (
          <motion.div
            key={dept}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-semibold text-foreground">{dept}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {authorities.filter(a => a.department === dept).length} officers assigned
                </p>
              </div>
            </div>
          </motion.div>
        ))}
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
    (async () => {
      try {
        const all = await getAllIssues();
        const candidates = all.filter(i => i.status === "open" || i.status === "in_progress");
        setIssues(candidates);
        // Pre-populate already escalated
        const alreadyEscalated = new Set(candidates.filter(i => i.escalated).map(i => i.id));
        setEscalatedIds(alreadyEscalated);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleEscalate = async (issue: CivicIssue) => {
    try {
      await updateIssueFields(issue.id, { escalated: true });
      setEscalatedIds(prev => new Set([...prev, issue.id]));
      if (issue.userId) {
        await createNotification({
          userId: issue.userId,
          type: "escalation",
          title: "Issue Escalated",
          message: `Your issue "${issue.title}" has been escalated to a supervisor for urgent attention.`,
          read: false,
          createdAt: new Date().toISOString(),
          issueId: issue.id,
        });
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

  const saveSla = () => {
    localStorage.setItem("civicsense_sla", JSON.stringify(sla));
    toast.success("SLA deadlines saved.");
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
                <button onClick={() => removeCategory(cat)} className="text-muted-foreground hover:text-destructive ml-1">
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
          <p className="text-xs text-muted-foreground mb-4">Set resolution time limits (days) per category</p>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{cat}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={1} max={30}
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
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <h4 className="font-display font-semibold text-foreground">Notification Settings</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Enable push notifications and alerts</p>
          </div>
          <button
            onClick={toggleNotif}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              notifEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
              notifEnabled ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </div>

        {/* Map Settings */}
        <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
          <div>
            <h4 className="font-display font-semibold text-foreground">Map Clustering</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Group nearby issue markers on the map</p>
          </div>
          <button
            onClick={toggleClustering}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              mapClustering ? "bg-primary" : "bg-muted"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
              mapClustering ? "translate-x-5" : "translate-x-0.5"
            )} />
          </button>
        </div>

      </div>
    </AdminLayout>
  );
};
