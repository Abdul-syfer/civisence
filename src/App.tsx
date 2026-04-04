import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/authContext";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CitizenHome from "./pages/citizen/CitizenHome";
import CitizenMap from "./pages/citizen/CitizenMap";
import CitizenReport from "./pages/citizen/CitizenReport";
import CitizenMyReports from "./pages/citizen/CitizenMyReports";
import CitizenAccount from "./pages/citizen/CitizenAccount";
import AuthorityHome from "./pages/authority/AuthorityHome";
import AuthorityMap from "./pages/authority/AuthorityMap";
import AuthorityReports from "./pages/authority/AuthorityReports";
import AuthorityAccount from "./pages/authority/AuthorityAccount";
import {
  AdminDashboard, AdminAuthorities, AdminIssues, AdminDepartments,
  AdminEscalations, AdminSettings
} from "./pages/admin/AdminPages";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Initializing CivicSense...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Initializing CivicSense...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user?.role === "admin" ? "admin" : user?.role === "authority" ? "authority" : "citizen"}`} /> : <LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Citizen */}
      <Route path="/citizen" element={<ProtectedRoute role="citizen"><CitizenHome /></ProtectedRoute>} />
      <Route path="/citizen/map" element={<ProtectedRoute role="citizen"><CitizenMap /></ProtectedRoute>} />
      <Route path="/citizen/report" element={<ProtectedRoute role="citizen"><CitizenReport /></ProtectedRoute>} />
      <Route path="/citizen/my-reports" element={<ProtectedRoute role="citizen"><CitizenMyReports /></ProtectedRoute>} />
      <Route path="/citizen/account" element={<ProtectedRoute role="citizen"><CitizenAccount /></ProtectedRoute>} />

      {/* Authority */}
      <Route path="/authority" element={<ProtectedRoute role="authority"><AuthorityHome /></ProtectedRoute>} />
      <Route path="/authority/map" element={<ProtectedRoute role="authority"><AuthorityMap /></ProtectedRoute>} />
      <Route path="/authority/reports" element={<ProtectedRoute role="authority"><AuthorityReports /></ProtectedRoute>} />
      <Route path="/authority/account" element={<ProtectedRoute role="authority"><AuthorityAccount /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/authorities" element={<ProtectedRoute role="admin"><AdminAuthorities /></ProtectedRoute>} />
      <Route path="/admin/issues" element={<ProtectedRoute role="admin"><AdminIssues /></ProtectedRoute>} />
      <Route path="/admin/departments" element={<ProtectedRoute role="admin"><AdminDepartments /></ProtectedRoute>} />
      <Route path="/admin/escalations" element={<ProtectedRoute role="admin"><AdminEscalations /></ProtectedRoute>} />

      <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
