import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Mail, Phone, Lock, User, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signInAnonymously } from "firebase/auth";

const ADMIN_EMAIL = "syfer071@gmail.com";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/lib/types";

const LoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"default" | "officer">("default");

  // Default login state (citizen + admin)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Authority state (using email/password mapped from their ID/phone conceptually)
  const [officerId, setOfficerId] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");
  const [showOfficerPassword, setShowOfficerPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: unknown) {
        // Auto-create the admin account on first login if it doesn't exist yet
        const error = err as Error & { code?: string };
        if (email === ADMIN_EMAIL && (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential")) {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }

      const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        toast.success(`Welcome back, ${userData.name}!`);
        if (userData.role === "admin") navigate("/admin");
        else if (userData.role === "authority") navigate("/authority");
        else navigate("/citizen");
      } else {
        // Profile will be created by authContext (e.g. admin first login) — wait for redirect
        if (email === ADMIN_EMAIL) {
          toast.success("Welcome, Admin!");
          navigate("/admin");
        } else {
          toast.error("Profile not found. Please contact support.");
          auth.signOut();
        }
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const error = err as Error & { code?: string };
      if (error.code === "auth/invalid-credential") {
        toast.error("Invalid email or password.");
      } else {
        toast.error(error.message || "Failed to login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Logic handled by onAuthStateChanged in AuthContext + profile redirect
      // but we toast here for instant feedback
      toast.success("Logging in with Google...");
    } catch (err: unknown) {
      console.error("Google login error:", err);
      const error = err as Error & { code?: string };
      if (error.code === "auth/unauthorized-domain") {
        toast.error("Domain not authorized for Google Sign-In. Please add this IP/Domain to Firebase Console -> Authentication -> Settings -> Authorized domains.");
      } else if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Failed to login with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to send reset email");
    }
  };

  const handleDemoLogin = async (role: "citizen" | "authority" = "citizen") => {
    setLoading(true);
    try {
      // Set a temporary flag for AuthContext to know which role to provision
      localStorage.setItem("demo_role", role);

      await signInAnonymously(auth);
      toast.success(`Logging in as Demo ${role === "authority" ? "Officer" : "Citizen"}...`);
    } catch (err: unknown) {
      console.error("Demo login error:", err);
      const error = err as Error & { code?: string };
      if (error.code === "auth/operation-not-allowed") {
        toast.error("Anonymous Authentication is disabled. Please enable it in your Firebase Console.");
      } else {
        toast.error("Demo login failed");
        setLoading(false);
      }
    }
  };

  const handleAuthorityLogin = async () => {
    if (!officerId || !officerPassword) {
      toast.error("Please enter Officer ID (Email) and password");
      return;
    }

    setLoading(true);
    try {
      // For authority, the system expects them to log in with their assigned email and password.
      // E.g., RM-W5-1024@civicsense.gov and their password.
      // If they type just "RM-W5-1024", we assume the domain @civicsense.gov (for mock purposes, or they just type email).
      const finalEmail = officerId.includes("@") ? officerId : `${officerId.toLowerCase()}@civicsense.gov`;

      const userCredential = await signInWithEmailAndPassword(auth, finalEmail, officerPassword);
      const userSnap = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        if (userData.role === "authority") {
          toast.success(`Welcome back, Officer!`);
          navigate("/authority");
        } else {
          toast.error("Access denied. Not an authority account.");
          auth.signOut();
        }
      }
    } catch (error) {
      console.error("Authority login error:", error);
      toast.error("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <img src={logo} alt="CivicSense" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">CivicSense</h1>
          <p className="text-sm text-muted-foreground mt-1">Smart Civic Issue Reporting</p>
        </div>

        {mode === "default" ? (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input id="email" placeholder="you@example.com" className="pl-10"
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleLogin} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Login
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/signup")} disabled={loading}>
              Create Account
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs text-muted-foreground">
                <span className="bg-background px-2">or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
            <div className="text-center mt-6 space-y-4">
              <button
                onClick={() => setMode("officer")}
                className="text-sm text-primary hover:underline font-medium block w-full text-center"
              >
                Login as Authority Officer →
              </button>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="text-[10px] h-8" onClick={() => handleDemoLogin("citizen")} disabled={loading}>
                  Skip: Citizen
                </Button>
                <Button variant="secondary" size="sm" className="text-[10px] h-8" onClick={() => handleDemoLogin("authority")} disabled={loading}>
                  Skip: Authority
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">DEVELOPMENT TESTING ONLY</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => { setMode("default"); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <p className="text-sm text-muted-foreground">Login with your official Officer Auth details.</p>
            <div className="space-y-2">
              <Label>Officer ID (or Email)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="e.g. RM-W5-1024 or email" className="pl-10"
                  value={officerId} onChange={(e) => setOfficerId(e.target.value)} disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showOfficerPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={officerPassword} onChange={(e) => setOfficerPassword(e.target.value)} disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleAuthorityLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowOfficerPassword(!showOfficerPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showOfficerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" onClick={handleAuthorityLogin} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Verify & Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
