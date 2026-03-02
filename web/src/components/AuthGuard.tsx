import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../auth/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}