import { useState, useEffect } from "react";
import { CivicIssue, issueCategories } from "@/lib/types";
import { getAllIssues, confirmIssue } from "@/lib/firestore";
import { useAuth } from "@/lib/authContext";
import IssueCard from "@/components/IssueCard";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { TrendingUp, CheckCircle2, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TrendingFilter = "unsolved" | "solved";
type LocationScope = "ward" | "city" | "district" | "state";

const LOCATION_SCOPES: { key: LocationScope; label: string }[] = [
  { key: "ward", label: "My Ward" },
  { key: "city", label: "City" },
  { key: "district", label: "District" },
  { key: "state", label: "State" },
];

const CitizenHome = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TrendingFilter>("unsolved");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationScope, setLocationScope] = useState<LocationScope>("state");
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const fetchedIssues = await getAllIssues();
        setIssues(fetchedIssues);
      } catch (error) {
        console.error("Error fetching issues:", error);
        toast.error("Failed to load issues");
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  // Issues with no city field are treated as belonging to the local city
  // (all pre-existing issues were created before city was stored)
  const inUserCity = (i: CivicIssue) => !i.city || i.city === user?.city;

  // Apply location scope first
  const locationFiltered = (() => {
    if (locationScope === "ward") return issues.filter(i => i.ward === user?.ward);
    if (locationScope === "city") return issues.filter(inUserCity);
    return issues; // district / state = all issues
  })();

  // Count per scope tab (total issues in that scope)
  const countForScope = (scope: LocationScope) => {
    if (scope === "ward") return issues.filter(i => i.ward === user?.ward).length;
    if (scope === "city") return issues.filter(inUserCity).length;
    return issues.length;
  };

  // Stats for current scope (used in the reported/solved counter)
  const scopeReported = locationFiltered.length;
  const scopeSolved = locationFiltered.filter(i => i.status === "resolved").length;

  // Base: solved/unsolved filter on top of location scope
  const baseFiltered = filter === "unsolved"
    ? locationFiltered.filter(i => i.status !== "resolved")
    : locationFiltered.filter(i => i.status === "resolved");

  // Then: category filter
  const filteredIssues = categoryFilter === "all"
    ? baseFiltered
    : baseFiltered.filter(i => i.category === categoryFilter);

  // Count per category within the current location + solved/unsolved view
  const countFor = (cat: string) =>
    cat === "all" ? baseFiltered.length : baseFiltered.filter(i => i.category === cat).length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-safe-nav">
        {/* Header */}
        <div className="relative overflow-hidden px-5 pt-safe-header pb-8 rounded-b-3xl">
          <div className="absolute inset-0 gradient-primary" />
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, hsl(95 52% 50% / 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(210 90% 55% / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, hsl(95 52% 50% / 0.4) 0%, transparent 50%), radial-gradient(circle at 20% 80%, hsl(210 90% 55% / 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, hsl(95 52% 50% / 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(210 90% 55% / 0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary-foreground/20"
              style={{ left: `${15 + i * 18}%`, top: `${30 + (i % 3) * 20}%` }}
              animate={{ y: [-10, 10, -10], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            />
          ))}

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.img
                  src={logo} alt="CivicSense"
                  className="w-10 h-10 rounded-xl bg-primary-foreground/10 p-0.5"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
                <div>
                  <h1 className="font-display text-lg font-bold text-primary-foreground">CivicSense</h1>
                  <p className="text-xs text-primary-foreground/70">Smart Civic Reporting</p>
                </div>
              </div>
              <NotificationBell />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-foreground/10 rounded-2xl p-5 backdrop-blur-sm border border-primary-foreground/10"
            >
              <h2 className="font-display text-xl font-bold text-primary-foreground mb-1">Your City. Your Voice.</h2>
              <p className="text-sm text-primary-foreground/80">Report problems and help improve your community.</p>
            </motion.div>
          </div>
        </div>

        {/* Trending Issues */}
        <div className="px-5 mt-6">
          {/* Row 1: title + solved/unsolved toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <TrendingUp className="w-5 h-5 text-accent" />
              </motion.div>
              <h2 className="font-display text-lg font-semibold text-foreground">Trending Issues</h2>
            </div>
            <div className="flex items-center bg-muted rounded-full p-0.5">
              <motion.button
                onClick={() => { setFilter("unsolved"); setCategoryFilter("all"); }}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-all ${filter === "unsolved" ? "bg-destructive text-destructive-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                whileTap={{ scale: 0.95 }}
              >Unsolved</motion.button>
              <motion.button
                onClick={() => { setFilter("solved"); setCategoryFilter("all"); }}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-all ${filter === "solved" ? "bg-success text-success-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                whileTap={{ scale: 0.95 }}
              >Solved</motion.button>
            </div>
          </div>

          {/* Row 2: Location scope filter */}
          {!loading && (
            <div className="flex gap-2 mb-3 -mx-5 px-5 overflow-x-auto scrollbar-none pb-1">
              {LOCATION_SCOPES.map(({ key, label }) => {
                const scopeCount = countForScope(key);
                const active = locationScope === key;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setLocationScope(key); setCategoryFilter("all"); }}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                      active
                        ? "bg-accent text-accent-foreground border-accent shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground"
                    )}
                  >
                    {label}
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      active ? "bg-accent-foreground/15 text-accent-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {scopeCount}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Row 3: Reported / Solved stats for current scope */}
          {!loading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`stats-${locationScope}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 mb-3"
              >
                <div className="flex items-center gap-1.5 bg-primary/8 border border-primary/15 text-primary px-3 py-1.5 rounded-xl">
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{scopeReported}</span>
                  <span className="text-[10px] text-primary/70">reported</span>
                </div>
                <div className="flex items-center gap-1.5 bg-success/8 border border-success/20 text-success px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{scopeSolved}</span>
                  <span className="text-[10px] text-success/70">solved</span>
                </div>
                {scopeReported > 0 && (
                  <div className="ml-auto text-[10px] text-muted-foreground font-medium">
                    {Math.round((scopeSolved / scopeReported) * 100)}% resolved
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Row 4: Category filter chips */}
          {!loading && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-5 px-5">
              {["all", ...issueCategories].map(cat => {
                const count = countFor(cat);
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
                    {cat === "all" ? "All" : cat}
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

          {/* Row 5: Active filter result count */}
          {!loading && (
            <motion.div className="mb-3" key={`count-${filter}-${categoryFilter}-${locationScope}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              {filter === "unsolved" ? (
                <span className="text-xs bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full font-medium">
                  {filteredIssues.length} unresolved
                  {categoryFilter !== "all" && ` · ${categoryFilter}`}
                </span>
              ) : (
                <span className="text-xs bg-success/10 text-success px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {filteredIssues.length} resolved
                  {categoryFilter !== "all" && ` · ${categoryFilter}`}
                </span>
              )}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key={`${filter}-${categoryFilter}-${locationScope}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredIssues.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <p className="text-sm">No {filter} {categoryFilter !== "all" ? `"${categoryFilter}" ` : ""}issues found.</p>
                  </div>
                ) : (
                  filteredIssues.map((issue, i) => (
                    <motion.div key={issue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <IssueCard
                        issue={issue}
                        onConfirm={async () => {
                          if (!user) return;
                          try {
                            await confirmIssue(issue.id, user.uid, filter === "solved");
                            setIssues(prev => prev.map(is =>
                              is.id === issue.id ? { ...is, reportCount: is.reportCount + 1 } : is
                            ));
                            toast.success(filter === "solved" ? "Resolution confirmed! Thank you." : "Issue confirmed! Thank you.");
                          } catch (err: unknown) {
                            if (err instanceof Error && err.message === "already_confirmed") {
                              toast.info("You've already confirmed this issue.");
                            } else {
                              toast.error("Failed to confirm. Please try again.");
                            }
                          }
                        }}
                        confirmLabel={filter === "solved" ? "Confirm Resolved" : undefined}
                      />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default CitizenHome;
