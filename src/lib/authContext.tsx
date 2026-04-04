import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole, UserProfile } from "./types";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

const ADMIN_EMAIL = "syfer071@gmail.com";

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
            const isAdmin = firebaseUser.email === ADMIN_EMAIL;

            if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              // Always enforce admin role for the designated admin email
              if (isAdmin && profile.role !== "admin") {
                await updateDoc(docRef, { role: "admin" });
                profile.role = "admin";
              }
              setUser(profile);
            } else {
              // Provision a default profile for new users
              const demoRole = localStorage.getItem("demo_role") || "citizen";
              localStorage.removeItem("demo_role");

              const baseProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: isAdmin ? "Admin" : (demoRole === "authority" ? "Officer Sharma" : "Citizen"),
                email: firebaseUser.email || "anonymous@civicsense.com",
                phone: "9876543210",
                role: (isAdmin ? "admin" : demoRole) as UserRole,
                ward: "5",
                createdAt: new Date().toISOString()
              };

              if (demoRole === "authority" && !isAdmin) {
                Object.assign(baseProfile, {
                  officerId: "RM-W5-1024",
                  department: "Road Maintenance",
                  active: true,
                  resolvedCount: 0
                });
              }

              await setDoc(docRef, baseProfile);
              setUser(baseProfile);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
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
