import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole, UserProfile } from "./types";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

const ADMIN_EMAILS = ["syfer071@gmail.com", "jayasurya.create@gmail.com"];

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => { },
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email ?? "");

            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              // Always enforce admin role for the designated admin emails
              if (isAdmin && profile.role !== "admin") {
                await updateDoc(docRef, { role: "admin" });
                profile.role = "admin";
              }
              setUser(profile);
            } else if (isAdmin) {
              // Admin first login — provision admin profile
              const baseProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: "Admin",
                email: firebaseUser.email || "admin@civicsense.com",
                phone: "",
                role: "admin",
                ward: "0",
                createdAt: new Date().toISOString()
              };
              await setDoc(docRef, baseProfile);
              setUser(baseProfile);
            } else {
              // No profile and not admin — deleted or unknown account. Sign them out.
              await signOut(auth);
              setUser(null);
              toast.error("Account not found. Please contact your administrator.");
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // If Firestore is offline but the user is authenticated, build a minimal
          // profile from Firebase Auth data so they aren't blocked from the app.
          const isOffline =
            error instanceof Error &&
            (error.message.includes("offline") ||
              (error as any).code === "unavailable");

          if (firebaseUser && isOffline) {
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email ?? "");
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || (isAdmin ? "Admin" : "Citizen"),
              email: firebaseUser.email || "anonymous@civicsense.com",
              phone: "",
              role: (isAdmin ? "admin" : "citizen") as UserRole,
              ward: "5",
              createdAt: new Date().toISOString(),
            });
            toast.warning("You're offline. Some features may be limited.");
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Full page reload clears all in-memory state and subscriptions,
      // preventing stale data from leaking to the next user session.
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAuthenticated: !!user && !loading }}>
      {children}
    </AuthContext.Provider>
  );
};
