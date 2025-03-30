// client/src/layouts/MainLayout.jsx
import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Bell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Generate navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { path: "/profile", label: "Profile", icon: <User size={18} /> },
    ];

    let roleSpecificItems = [];

    switch (user?.role) {
      case "owner":
        roleSpecificItems = [
          { path: "/owner/dashboard", label: "Dashboard" },
          { path: "/owner/users", label: "User Management" },
          { path: "/owner/products", label: "Products" },
          { path: "/owner/reports", label: "Reports" },
          { path: "/owner/analytics", label: "Analytics" },
          { path: "/owner/map", label: "Shops Map" },
        ];
        break;
      case "warehouse_manager":
        roleSpecificItems = [
          { path: "/warehouse/dashboard", label: "Dashboard" },
          { path: "/warehouse/inventory", label: "Inventory" },
          { path: "/warehouse/distribution", label: "Distribution" },
          { path: "/warehouse/returns", label: "Returns" },
        ];
        break;
      case "salesman":
        roleSpecificItems = [
          { path: "/salesman/dashboard", label: "Dashboard" },
          { path: "/salesman/shops", label: "Shops" },
          { path: "/salesman/deliveries", label: "Deliveries" },
          { path: "/salesman/returns", label: "Returns" },
          { path: "/salesman/map", label: "Map" },
        ];
        break;
      case "shop":
        roleSpecificItems = [
          { path: "/shop/dashboard", label: "Dashboard" },
          { path: "/shop/orders", label: "Orders" },
          { path: "/shop/returns", label: "Returns" },
        ];
        break;
      default:
        roleSpecificItems = [];
    }

    return [...roleSpecificItems, ...commonItems];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <span className="sr-only">Open sidebar</span>
                  {isSidebarOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <span className="text-lg font-bold text-primary-700">
                  Sathira Sweet
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <Bell size={20} />
              </button>

              {/* User dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.fullName}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace("_", " ")}
                    </div>
                  </div>
                  <button
                    className="p-1 rounded-full bg-gray-200 text-gray-700"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar for mobile */}
        <div
          className={`fixed inset-0 z-40 flex md:hidden transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        >
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-300 ease-in-out`}
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center px-4">
                <span className="text-lg font-bold text-primary-700">
                  Sathira Sweet
                </span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-56">
            <div className="flex flex-col h-0 flex-1 bg-white border-r shadow-sm">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="flex-1 px-2 space-y-1">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `group flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          isActive
                            ? "bg-primary-100 text-primary-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`
                      }
                    >
                      {item.icon && <span className="mr-3">{item.icon}</span>}
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
