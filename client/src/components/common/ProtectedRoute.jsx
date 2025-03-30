// client/src/components/common/ProtectedRoute.jsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "./Loader";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
