import React from "react";
import { useAuth } from "./Context/AuthProvider";
import { Navigate } from "react-router-dom";

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  return children;
}
