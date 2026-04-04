import { Home, Map, Plus, FileText, User, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";

interface Tab {
  path: string;
  icon: typeof Home;
  label: string;
  isCenter?: boolean;
}

const citizenTabs: Tab[] = [
  { path: "/citizen", icon: Home, label: "Home" },
  { path: "/citizen/map", icon: Map, label: "Map" },
  { path: "/citizen/report", icon: Plus, label: "Report", isCenter: true },
  { path: "/citizen/my-reports", icon: FileText, label: "My Reports" },
  { path: "/citizen/account", icon: User, label: "Account" },
];

const authorityTabs: Tab[] = [
  { path: "/authority", icon: Home, label: "Home" },
  { path: "/authority/map", icon: Map, label: "Map" },
  { path: "/authority/reports", icon: BarChart3, label: "Reports" },
  { path: "/authority/account", icon: User, label: "Account" },
];

const PARTICLE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45 93% 58%)",
  "hsl(280 70% 60%)",
];

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = user?.role === "authority" ? authorityTabs : citizenTabs;
  const [reportParticles, setReportParticles] = useState<Array<{ id: number; angle: number; dist: number; size: number; color: string }>>([]);

  const handleReportClick = useCallback(() => {
    const particles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / 12) * i + (Math.random() - 0.5) * 25,
      dist: 25 + Math.random() * 30,
      size: 3 + Math.random() * 4,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    }));
    setReportParticles(particles);
    setTimeout(() => setReportParticles([]), 700);
    navigate("/citizen/report");
  }, [navigate]);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg"
      style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}
    >
      <div className="flex items-end py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex-1 flex flex-col items-center justify-end gap-0.5 py-2 transition-all relative rounded-lg mx-1",
                tab.isCenter
                  ? "-mt-5"
                  : active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.isCenter ? (
                <div className="relative overflow-visible">
                  <motion.div
                    className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReportClick();
                    }}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                  <AnimatePresence>
                    {reportParticles.map((p) => {
                      const rad = (p.angle * Math.PI) / 180;
                      return (
                        <motion.span
                          key={p.id}
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: p.size,
                            height: p.size,
                            backgroundColor: p.color,
                            left: "50%",
                            top: "50%",
                            marginLeft: -p.size / 2,
                            marginTop: -p.size / 2,
                          }}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(rad) * p.dist,
                            y: Math.sin(rad) * p.dist,
                            opacity: 0,
                            scale: 0.2,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-[1px] left-3 right-3 h-[2px] bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </>
              )}
              <span className={cn("text-[10px] font-medium", tab.isCenter && "mt-1")}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
