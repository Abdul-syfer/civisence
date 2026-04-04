import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { CivicIssue } from "@/lib/types";
import { getIssuesByUser } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import StatusTimeline from "@/components/StatusTimeline";
import SeverityBadge from "@/components/SeverityBadge";
import { MapPin, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const statusLabels = { open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected" };
const statusStyles = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  rejected: "bg-muted text-muted-foreground",
};

const CitizenMyReports = () => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      if (!user?.uid) return;
      try {
        const myIssues = await getIssuesByUser(user.uid);
        setIssues(myIssues);
      } catch (error) {
        console.error("Error fetching my issues", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-6 rounded-b-3xl">
        <h1 className="font-display text-xl font-bold text-primary-foreground">My Reports</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">{loading ? "..." : issues.length} issues reported</p>
      </div>

      <div className="px-5 mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">You haven't reported any issues yet.</p>
          </div>
        ) : (
          issues.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <button
                onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={issue.severity} />
                      <Badge variant="outline" className={cn("text-[10px]", statusStyles[issue.status])}>
                        {statusLabels[issue.status]}
                      </Badge>
                    </div>
                    <h3 className="font-display font-semibold text-sm text-foreground">{issue.title}</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{issue.location}</span>
                    </div>
                  </div>
                  {expanded === issue.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expanded === issue.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-border"
                >
                  <p className="text-sm text-muted-foreground mb-4">{issue.description}</p>
                  <StatusTimeline steps={issue.timeline} />
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CitizenMyReports;
