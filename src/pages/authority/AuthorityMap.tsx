import BottomNav from "@/components/BottomNav";
import { getIssuesByWard } from "@/lib/firestore";
import { CivicIssue, issueCategories } from "@/lib/types";
import { MapPin, Clock, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SeverityBadge from "@/components/SeverityBadge";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/authContext";
import IssueMap from "@/components/IssueMap";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabels: Record<CivicIssue["status"], string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", rejected: "Rejected"
};

const AuthorityMap = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<CivicIssue | null>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>(searchParams.get("filter") || "all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (user?.ward) {
      getIssuesByWard(user.ward).then(setIssues).catch(() => {});
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [user]);

  const filteredIssues = issues
    .filter(i => severityFilter === "all" ? true : i.severity === severityFilter)
    .filter(i => categoryFilter === "all" ? true : i.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      {/* Severity filter row */}
      <div className="absolute top-4 left-4 right-16 z-[1001] flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {["all", "severe", "medium", "minor"].map(s => (
            <Button
              key={s}
              size="sm"
              className={cn(
                "rounded-full text-[10px] h-7 px-3 capitalize shadow-md flex-shrink-0",
                severityFilter === s
                  ? "gradient-primary text-primary-foreground"
                  : "bg-card/90 backdrop-blur-sm border border-border text-foreground hover:bg-muted"
              )}
              onClick={() => setSeverityFilter(s)}
            >
              {s === "all" ? "All Severity" : s}
            </Button>
          ))}
        </div>

        {/* Category filter row */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {["all", ...issueCategories].map(cat => (
            <Button
              key={cat}
              size="sm"
              className={cn(
                "rounded-full text-[10px] h-7 px-3 shadow-md flex-shrink-0 whitespace-nowrap",
                categoryFilter === cat
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card/90 backdrop-blur-sm border border-border text-foreground hover:bg-muted"
              )}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === "all" ? "All Types" : cat}
            </Button>
          ))}
        </div>

        {/* Active filter summary badge */}
        {(severityFilter !== "all" || categoryFilter !== "all") && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-card/90 backdrop-blur-sm text-foreground px-2.5 py-1 rounded-full border border-border shadow">
              {filteredIssues.length} issue{filteredIssues.length !== 1 ? "s" : ""} shown
            </span>
            <button
              className="text-[10px] bg-card/90 backdrop-blur-sm text-destructive px-2.5 py-1 rounded-full border border-border shadow"
              onClick={() => { setSeverityFilter("all"); setCategoryFilter("all"); }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <IssueMap
        issues={filteredIssues}
        userLocation={userLocation}
        onSelectIssue={setSelected}
        center={userLocation ? [userLocation.lat, userLocation.lng] : [28.6139, 77.209]}
        className="h-[100vh]"
      />

      {selected && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-[1001] animate-slide-up">
          <div className="bg-card rounded-2xl border border-border shadow-2xl p-4 max-w-lg mx-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={selected.severity} size="md" />
                  <span className="text-[10px] bg-muted text-foreground px-2 py-0.5 rounded-full">
                    {selected.category}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mt-1">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selected.location}</div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date(selected.reportedAt).toLocaleDateString()}</div>
                <div className="flex items-center gap-1"><Users className="w-4 h-4" />{selected.reportCount} reports</div>
              </div>
            </div>
            <Badge variant="outline" className="mt-2">{statusLabels[selected.status]}</Badge>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AuthorityMap;
