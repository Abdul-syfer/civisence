import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        toast.error("No account found with that email address.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please wait before trying again.");
      } else if (error.code === "auth/network-request-failed") {
        toast.error("No internet connection. Please check your network.");
      } else {
        toast.error(error.message || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="CivicSense"
            className="w-16 h-16 mx-auto mb-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          />
          <h1 className="font-display text-xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? "Check your inbox" : "We'll send you a reset link"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleReset()}
                      disabled={loading}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter the email linked to your CivicSense account. We'll send a secure link to reset your password.
                </p>

                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Link
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="bg-card/80 backdrop-blur border border-border rounded-2xl p-8 shadow-sm text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "oklch(0.72 0.19 145 / 0.12)" }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: "var(--civic-green)" }} />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-foreground mb-1">Email Sent!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A password reset link has been sent to{" "}
                  <span className="font-semibold text-foreground">{email}</span>.
                  Check your inbox and spam folder.
                </p>
              </div>
              <div className="pt-2 space-y-2">
                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </Button>
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Try a different email
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PasswordResetPage;
