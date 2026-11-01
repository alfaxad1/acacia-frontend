import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps a route so it is only accessible to ADMIN users.
 * Non-authenticated users → /login
 * Authenticated non-admins  → / (dashboard)
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  })();

  if (userData.role !== "ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}
