import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Mail, Phone, Lock, User, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUserProfile } from "@/lib/firestore";

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "", ward: "" });
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill required fields (Name, Email, Password)");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Create Firestore profile
      try {
        await createUserProfile(userCredential.user.uid, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: "citizen",
          city: form.city || "New Delhi",
          ward: form.ward || "5"
        });
        toast.success("Account created successfully!");
        navigate("/citizen");
      } catch (err: unknown) {
        console.error("Firestore profile error:", err);
        // Delete the orphaned Firebase Auth account so the user can retry cleanly
        try { await userCredential.user.delete(); } catch (_) { /* ignore cleanup errors */ }
        toast.error("Account setup failed. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      const error = err as Error & { code?: string };
      if (error.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists.");
      } else if (error.code === "auth/weak-password") {
        toast.error("Password is too weak. Please use at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address format.");
      } else if (error.code === "auth/operation-not-allowed") {
        toast.error("Email/Password signup is disabled in Firebase Console.");
      } else if (error.code === "auth/unauthorized-domain") {
        toast.error("This domain/IP is not authorized. Enable it in Firebase Console -> Auth -> Settings.");
      } else {
        toast.error(error.message || "Failed to create account");
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
          className="group inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-full transition-all mb-6 hover:opacity-90"
          style={{ background: "var(--civic-navy)" }}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" /> Back to Login
        </button>

        <div className="text-center mb-8 animate-fade-in">
          <img src={logo} alt="CivicSense" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join CivicSense and make a difference</p>
        </div>

        <div className="space-y-4 animate-fade-in">
          {[
            { key: "name", label: "Full Name", icon: User, placeholder: "John Doe", required: true },
            { key: "email", label: "Email", icon: Mail, placeholder: "you@example.com", required: true },
            { key: "phone", label: "Phone Number", icon: Phone, placeholder: "+91 XXXXX XXXXX" },
            { key: "password", label: "Password", icon: Lock, placeholder: "••••••••", type: "password", required: true },
            { key: "city", label: "City", icon: MapPin, placeholder: "Your city" },
            { key: "ward", label: "Ward (optional)", icon: MapPin, placeholder: "Ward number" },
          ].map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}{field.required && " *"}</Label>
              <div className="relative">
                <field.icon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  className="pl-10"
                  value={(form as Record<string, string>)[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          <Button className="w-full gradient-primary text-primary-foreground mt-2" onClick={handleSignup} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
