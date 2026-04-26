import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AuthActionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    if (mode === "resetPassword" && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(resolvedEmail => {
          setEmail(resolvedEmail);
          setVerifying(false);
        })
        .catch(() => {
          setLinkError("This password reset link is invalid or has expired.");
          setVerifying(false);
        });
    } else {
      setLinkError("This link is not supported or has already been used.");
      setVerifying(false);
    }
  }, [mode, oobCode]);

  const handleReset = async () => {
    if (!password) { toast.error("Please enter a new password"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (!oobCode) return;

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === "auth/expired-action-code") {
        toast.error("This link has expired. Please request a new one.");
      } else if (e.code === "auth/invalid-action-code") {
        toast.error("This link has already been used or is invalid.");
      } else if (e.code === "auth/weak-password") {
        toast.error("Password too weak. Use at least 6 characters.");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <img src={logo} alt="CivicSense" className="w-16 h-16 mx-auto mb-3" />
            <h1 className="font-display text-xl font-bold text-foreground">CivicSense</h1>
            <p className="text-sm text-muted-foreground mt-1">Smart Civic Reporting Platform</p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {/* Loading state */}
          {verifying && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-14">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            </motion.div>
          )}

          {/* Link error */}
          {!verifying && linkError && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/80 backdrop-blur border border-destructive/20 rounded-2xl p-8 text-center space-y-5 shadow-sm"
            >
              <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-destructive/10">
                <ShieldAlert className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-foreground mb-1">Link Expired</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{linkError}</p>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => navigate("/reset-password")}>
                Request a New Link
              </Button>
              <button type="button" onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </motion.div>
          )}

          {/* Success */}
          {!verifying && !linkError && done && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="bg-card/80 backdrop-blur border border-border rounded-2xl p-8 text-center space-y-5 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "oklch(0.72 0.19 145 / 0.12)" }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: "var(--civic-green)" }} />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-foreground mb-1">Password Updated!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your CivicSense password has been successfully reset.<br />You can now sign in with your new password.
                </p>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            </motion.div>
          )}

          {/* Reset form */}
          {!verifying && !linkError && !done && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Resetting password for</p>
                  <p className="text-sm font-semibold text-foreground">{email}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleReset()}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save New Password
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Login
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthActionPage;
