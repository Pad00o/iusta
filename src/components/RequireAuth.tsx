import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isAdmin, refreshUser } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(!adminOnly);

  // For admin-only routes, re-confirm admin status from the server before rendering
  // so a tampered localStorage session flag cannot grant access.
  useEffect(() => {
    if (!adminOnly || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminOnly, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }
  if (adminOnly && !checked) {
    return null; // brief gate while we confirm with the server
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
