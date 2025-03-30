// client/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Placeholder Dashboard Components (you'll implement these later)
const OwnerDashboard = () => <div className="p-6">Owner Dashboard</div>;
const WarehouseDashboard = () => (
  <div className="p-6">Warehouse Manager Dashboard</div>
);
const SalesmanDashboard = () => <div className="p-6">Salesman Dashboard</div>;
const ShopDashboard = () => <div className="p-6">Shop Dashboard</div>;
const Unauthorized = () => (
  <div className="flex h-screen items-center justify-center bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        Unauthorized Access
      </h1>
      <p className="text-gray-700 mb-4">
        You don't have permission to access this page. Please contact your
        administrator if you believe this is an error.
      </p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Role-specific dashboard routing
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "owner":
      return <Navigate to="/owner/dashboard" replace />;
    case "warehouse_manager":
      return <Navigate to="/warehouse/dashboard" replace />;
    case "salesman":
      return <Navigate to="/salesman/dashboard" replace />;
    case "shop":
      return <Navigate to="/shop/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Not Found Page
const NotFound = () => (
  <div className="flex h-screen items-center justify-center bg-gray-100">
    <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-gray-700 mb-4">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => (window.location.href = "/")}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Go to Home
      </button>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Dashboard Route - Redirects based on user role */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={<DashboardRouter />} />}
      />

      {/* Owner Routes */}
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute
            element={<OwnerDashboard />}
            allowedRoles={["owner"]}
          />
        }
      />

      {/* Warehouse Manager Routes */}
      <Route
        path="/warehouse/dashboard"
        element={
          <ProtectedRoute
            element={<WarehouseDashboard />}
            allowedRoles={["warehouse_manager"]}
          />
        }
      />

      {/* Salesman Routes */}
      <Route
        path="/salesman/dashboard"
        element={
          <ProtectedRoute
            element={<SalesmanDashboard />}
            allowedRoles={["salesman"]}
          />
        }
      />

      {/* Shop Routes */}
      <Route
        path="/shop/dashboard"
        element={
          <ProtectedRoute element={<ShopDashboard />} allowedRoles={["shop"]} />
        }
      />

      {/* Unauthorized Access */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root Route - Redirect to login or dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
