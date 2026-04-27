import { useState, useEffect } from "react";
import { CivicIssue } from "@/lib/types";
import { subscribeToIssuesByWard } from "@/lib/firestore";
import { useNavigate } from "react-router-dom";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";
import logo from "@/assets/logo.png";
import { useAuth } from "@/lib/authContext";
import { TrendingUp, Shield, Loader2 } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AuthorityHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.ward) { setLoading(false); return; }
    const unsub = subscribeToIssuesByWard(
      user.ward,
      (wardIssues) => {
        setIssues(
          wardIssues.filter(i =>
            !i.isDuplicate &&
            i.status !== "resolved" &&
            i.status !== "rejected" &&
            (user.department
              ? i.department === user.department ||
                (i.additionalDepartments ?? []).includes(user.department)
              : true)
          )
        );
        setLoading(false);
      },
      (err) => {
        toast.error("Failed to load issues: " + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user?.ward, user?.department]);

  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      <div className="gradient-primary px-5 pt-safe-header pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CivicSense" className="w-10 h-10 rounded-xl bg-primary-foreground/10 p-0.5" />
            <div>
              <h1 className="font-display text-lg font-bold text-primary-foreground">CivicSense</h1>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-accent" />
                <p className="text-xs text-primary-foreground/70">Authority Panel</p>
              </div>
            </div>
          </div>
          <NotificationBell />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-foreground/10 rounded-2xl p-5 backdrop-blur-sm border border-primary-foreground/10"
        >
          <p className="text-sm text-primary-foreground/80">Welcome,</p>
          <h2 className="font-display text-xl font-bold text-primary-foreground">{user?.name}</h2>
          <p className="text-xs text-primary-foreground/60 mt-1">{user?.department} · {user?.ward}</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-2 mt-6">
          {[
            { label: "Severe", count: issues.filter(i => i.severity === "severe").length, color: "bg-destructive/20 text-destructive", value: "severe" },
            { label: "Medium", count: issues.filter(i => i.severity === "medium").length, color: "bg-warning/20 text-warning", value: "medium" },
            { label: "Minor", count: issues.filter(i => i.severity === "minor").length, color: "bg-accent/20 text-accent", value: "minor" },
          ].map((stat) => (
            <motion.button
              key={stat.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/authority/map?filter=${stat.value}`)}
              className={cn("rounded-2xl p-3 text-center backdrop-blur-sm border border-primary-foreground/10", stat.color)}
            >
              <p className="font-display text-xl font-bold">{loading ? "-" : stat.count}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-8 mt-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg font-semibold text-foreground">Issues in Your Ward</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : issues.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No pending issues in your ward.</p>
          ) : (
            issues.map((issue, i) => (
              <motion.div key={issue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <IssueCard issue={issue} showActions={false} showSeverity={false} />
              </motion.div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AuthorityHome;
