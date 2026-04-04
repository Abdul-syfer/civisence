import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { CivicIssue, issueCategories } from "@/lib/types";
import { getIssuesByWard, updateIssueStatus, createNotification } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import SeverityBadge from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const statusLabels: Record<CivicIssue["status"], string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected"
};
const statusStyles: Record<CivicIssue["status"], string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
};

const AuthorityReports = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CivicIssue["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchWardIssues = async () => {
      if (!user?.ward) return;
      try {
        const wardIssues = await getIssuesByWard(user.ward);
        setIssues(wardIssues);
      } catch (error) {
        console.error("Error fetching ward issues", error);
        toast.error("Failed to load your ward's reports.");
      } finally {
        setLoading(false);
      }
    };
    fetchWardIssues();
  }, [user]);

  const displayed = issues
    .filter(i => statusFilter === "all" ? true : i.status === statusFilter)
    .filter(i => categoryFilter === "all" ? true : i.category === categoryFilter);

  const countByStatus = (s: CivicIssue["status"] | "all") =>
    s === "all" ? issues.length : issues.filter(i => i.status === s).length;

  const countByCategory = (cat: string) =>
    cat === "all"
      ? issues.filter(i => statusFilter === "all" || i.status === statusFilter).length
      : issues.filter(i => i.category === cat && (statusFilter === "all" || i.status === statusFilter)).length;

  const handleUpdateStatus = async (id: string, status: CivicIssue["status"]) => {
    try {
      await updateIssueStatus(id, status);

      // Build the same timeline entry that firestore.ts appends server-side,
      // so local state stays in sync without a full re-fetch.
      const timelineLabels: Partial<Record<CivicIssue["status"], string>> = {
        in_progress: "Work started by authority",
        resolved: "Issue resolved",
        rejected: "Issue marked as invalid",
      };
      const newEntry = timelineLabels[status]
        ? { label: timelineLabels[status]!, date: new Date().toISOString(), done: true }
        : null;

      setIssues(prev => prev.map(i =>
        i.id === id
          ? { ...i, status, timeline: newEntry ? [...(i.timeline ?? []), newEntry] : i.timeline }
          : i
      ));
      toast.success(`Issue marked as ${statusLabels[status]}`);

      const updatedIssue = issues.find(i => i.id === id);
      if (updatedIssue?.userId) {
        const messages: Partial<Record<CivicIssue["status"], string>> = {
          in_progress: "Your issue is now being worked on by our team.",
          resolved: "Great news! Your reported issue has been resolved.",
          rejected: "Your issue report has been reviewed and marked as invalid.",
        };
        await createNotification({
          userId: updatedIssue.userId,
          type: status === "resolved" ? "resolution" : "issue_update",
          title: status === "resolved" ? "Issue Resolved!" : "Issue Status Updated",
          message: messages[status] || `Your issue status changed to ${statusLabels[status]}.`,
          read: false,
          createdAt: new Date().toISOString(),
          issueId: id,
        });
      }
    } catch (error) {
      console.error("Status update error", error);
      toast.error("Failed to update status");
    }
  };

  const statCards = [
    { label: "Total", value: "all" as const, className: "bg-primary/10 text-primary" },
    { label: "Open", value: "open" as const, className: "bg-destructive/10 text-destructive" },
    { label: "In Progress", value: "in_progress" as const, className: "bg-warning/10 text-warning" },
    { label: "Resolved", value: "resolved" as const, className: "bg-success/10 text-success" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div 
        className="gradient-primary px-5 pb-6 rounded-b-3xl"
        style={{ paddingTop: 'calc(var(--safe-area-top, 0px) + 2.5rem)' }}
      >
        <h1 className="font-display text-xl font-bold text-primary-foreground">Reports Dashboard</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Ward {user?.ward} · {user?.department}</p>
      </div>

      <div className="px-5 mt-6">
        {/* Status filter cards — clickable */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {statCards.map(s => (
            <motion.button
              key={s.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "rounded-xl p-3 text-center transition-all border-2",
                s.className,
                statusFilter === s.value ? "border-current shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <p className="font-display font-bold text-xl">{loading ? "-" : countByStatus(s.value)}</p>
              <p className="text-[10px] font-medium leading-tight">{s.label}</p>
            </motion.button>
          ))}
        </div>

        {/* Category filter chips */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4 -mx-5 px-5">
            {["all", ...issueCategories].map(cat => {
              const count = countByCategory(cat);
              const active = categoryFilter === cat;
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "All Categories" : cat}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[10px] font-bold", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Active filter summary */}
        {(statusFilter !== "all" || categoryFilter !== "all") && !loading && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Showing:</span>
            {statusFilter !== "all" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
                {statusLabels[statusFilter]}
                <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setStatusFilter("all")}>×</button>
              </span>
            )}
            {categoryFilter !== "all" && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-foreground">
                {categoryFilter}
                <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setCategoryFilter("all")}>×</button>
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{displayed.length} result{displayed.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Issues list */}
        <AnimatePresence mode="wait">
          <motion.div key={`${statusFilter}-${categoryFilter}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No issues match the selected filters.</p>
                <button
                  className="text-xs text-primary underline mt-2"
                  onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((issue, i) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={issue.severity} />
                          <Badge variant="outline" className={cn("text-[10px]", statusStyles[issue.status])}>
                            {statusLabels[issue.status]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {issue.category}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-sm text-foreground">{issue.title}</h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{issue.location}</div>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{new Date(issue.reportedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1"><Users className="w-3 h-3" />{issue.reportCount}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      {issue.status === "open" && (
                        <Button size="sm" className="text-xs h-7 flex-1 gradient-primary text-primary-foreground"
                          onClick={() => handleUpdateStatus(issue.id, "in_progress")}>
                          <Play className="w-3 h-3 mr-1" /> Start Progress
                        </Button>
                      )}
                      {issue.status === "in_progress" && (
                        <Button size="sm" className="text-xs h-7 flex-1 bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handleUpdateStatus(issue.id, "resolved")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                        </Button>
                      )}
                      {issue.status === "open" && (
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive"
                          onClick={() => handleUpdateStatus(issue.id, "rejected")}>
                          <XCircle className="w-3 h-3 mr-1" /> Invalid
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

export default AuthorityReports;
