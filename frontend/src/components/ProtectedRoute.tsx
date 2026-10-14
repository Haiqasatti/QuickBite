import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";
import { EmptyState, LoadingState } from "./StateViews";

export function ProtectedRoute({ role, children }: { role?: UserRole; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingState label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) {
    return (
      <div className="container page">
        <EmptyState
          title="Access restricted"
          description="Your account doesn't have permission to view this page."
          action={
            <Link className="btn btn-primary" to="/">
              Back to the menu
            </Link>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}