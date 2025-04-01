// MainLayout.jsx with updated navigation paths

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, TrendingUp, Map } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    const commonItems = [
      { path: "/profile", label: "Profile", icon: <User size={18} /> },
    ];

    let roleSpecificItems = [];

    switch (user?.role) {
      case "owner":
        roleSpecificItems = [
          { path: "/dashboard", label: "Dashboard" },
          { path: "/users", label: "User Management" },
          { path: "/products", label: "Products" },
          { path: "/reports", label: "Reports" },
          {
            path: "/advanced-analytics",
            label: "Advanced Analytics",
            icon: <TrendingUp size={18} />,
          },
          {
            path: "/shops-map",
            label: "Shops Map",
            icon: <Map size={18} />,
          },
        ];
        break;
      case "warehouse_manager":
        roleSpecificItems = [
          { path: "/dashboard", label: "Dashboard" },
          { path: "/inventory", label: "Inventory" },
          { path: "/distribution", label: "Distribution" },
          { path: "/returns/warehouse", label: "Returns" },
        ];
        break;
      case "salesman":
        roleSpecificItems = [
          { path: "/dashboard/salesman", label: "Dashboard" },
          { path: "/shops", label: "Shops" },
          { path: "/deliveries", label: "Deliveries" },
          { path: "/returns", label: "Returns" },
          { path: "/map", label: "Map" },
        ];
        break;
      case "shop":
        roleSpecificItems = [
          { path: "/dashboard", label: "Dashboard" },
          { path: "/orders", label: "Orders" },
          { path: "/returns/shop", label: "Returns" },
        ];
        break;
      default:
        roleSpecificItems = [];
    }

    return [...roleSpecificItems, ...commonItems];
  };

  const navItems = getNavItems();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-indigo-600">
            Sathira Sweet puka2 and ata
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-md ${
                    location.pathname === item.path
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile menu button and overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white shadow-md p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-600">Sathira Sweet</h2>
        <button onClick={toggleMobileMenu} className="text-gray-700">
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-gray-800 bg-opacity-50">
          <div className="bg-white w-64 h-full overflow-y-auto shadow-lg">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold text-indigo-600">Menu</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`block p-2 rounded-md ${
                        location.pathname === item.path
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
