import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Phone, Building2, MapPin, LogOut, Shield } from "lucide-react";

const AuthorityAccount = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-12 pb-10 rounded-b-3xl">
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

        <Button
          variant="outline"
          className="w-full mt-6 text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default AuthorityAccount;
