// client/src/App.jsx

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { UIProvider } from "./contexts/UIContext";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Reports from "./pages/owner/Reports";
import UserManagement from "./pages/owner/UserManagement";
import ProductManagement from "./pages/owner/ProductManagement";
import InventoryManagement from "./pages/warehouse/Inventory";
import Distribution from "./pages/warehouse/Distribution";
import Returns from "./pages/warehouse/Returns";
import ShopManagement from "./pages/salesman/Shops";
import Deliveries from "./pages/salesman/Deliveries";
import SalesmanInventory from "./pages/salesman/Inventory";
import ShopOrders from "./pages/shop/Orders";
import ShopReturns from "./pages/shop/Returns";
import ShopProfile from "./pages/shop/Profile";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <UIProvider>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            {/* Main App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Owner Routes */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={["owner"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["owner"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute allowedRoles={["owner"]}>
                    <ProductManagement />
                  </ProtectedRoute>
                }
              />

              {/* Warehouse Manager Routes */}
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={["owner", "warehouse_manager"]}>
                    <InventoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distribution"
                element={
                  <ProtectedRoute allowedRoles={["warehouse_manager"]}>
                    <Distribution />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/returns/warehouse"
                element={
                  <ProtectedRoute allowedRoles={["warehouse_manager"]}>
                    <Returns />
                  </ProtectedRoute>
                }
              />

              {/* Salesman Routes */}
              <Route
                path="/shops"
                element={
                  <ProtectedRoute allowedRoles={["salesman"]}>
                    <ShopManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deliveries"
                element={
                  <ProtectedRoute allowedRoles={["salesman"]}>
                    <Deliveries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory/salesman"
                element={
                  <ProtectedRoute allowedRoles={["salesman"]}>
                    <SalesmanInventory />
                  </ProtectedRoute>
                }
              />

              {/* Shop Routes */}
              <Route
                path="/orders"
                element={
                  <ProtectedRoute allowedRoles={["shop"]}>
                    <ShopOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/returns/shop"
                element={
                  <ProtectedRoute allowedRoles={["shop"]}>
                    <ShopReturns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={["shop"]}>
                    <ShopProfile />
                  </ProtectedRoute>
                }
              />
            </Route>
            // Update your routes in app.js or router file // Before (with
            individual routes)
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route
              path="/warehouse/dashboard"
              element={<WarehouseDashboard />}
            />
            <Route path="/salesman/dashboard" element={<SalesmanDashboard />} />
            <Route path="/shop/dashboard" element={<ShopDashboard />} />
            // After (with central dashboard routing)
            <Route path="/dashboard" element={<Dashboard />} />
            // Update your routes configuration // Add these new routes to your
            existing routes
            <Route
              path="/owner/advanced-analytics"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <AdvancedAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/shops-map"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <ShopsMap />
                </ProtectedRoute>
              }
            />
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UIProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
