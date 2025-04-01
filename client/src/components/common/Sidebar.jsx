// client/src/components/common/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../hooks/useUI";
import {
  LayoutDashboard,
  Users,
  Package,
  Box,
  TrendingUp,
  RefreshCw,
  FileText,
  Map,
  Truck,
  Store,
  ShoppingCart,
  UserCircle,
  Briefcase,
} from "lucide-react";

const Sidebar = () => {
  const { user } = useAuth();
  const { sidebarOpen } = useUI();

  if (!sidebarOpen) {
    return null;
  }

  const navLinks = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["owner", "warehouse_manager", "salesman", "shop"],
    },
  ];

  // Owner specific links
  if (user?.role === "owner") {
    navLinks.push(
      {
        title: "Reports",
        path: "/reports",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "User Management",
        path: "/users",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Product Management",
        path: "/products",
        icon: <Package className="h-5 w-5" />,
      },
      {
        title: "Suppliers",
        path: "/suppliers",
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        title: "Inventory",
        path: "/inventory",
        icon: <Box className="h-5 w-5" />,
      }
    );
  }

  // Warehouse Manager specific links
  if (user?.role === "warehouse_manager") {
    navLinks.push(
      {
        title: "Inventory",
        path: "/inventory",
        icon: <Box className="h-5 w-5" />,
      },
      {
        title: "Distribution",
        path: "/distribution",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        title: "Returns",
        path: "/returns/warehouse",
        icon: <RefreshCw className="h-5 w-5" />,
      }
    );
  }

  // Salesman specific links
  if (user?.role === "salesman") {
    navLinks.push(
      {
        title: "Shop Management",
        path: "/shops",
        icon: <Store className="h-5 w-5" />,
      },
      {
        title: "Deliveries",
        path: "/deliveries",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        title: "Inventory",
        path: "/inventory/salesman",
        icon: <Box className="h-5 w-5" />,
      },
      {
        title: "Map",
        path: "/map",
        icon: <Map className="h-5 w-5" />,
      }
    );
  }

  // Shop specific links
  if (user?.role === "shop") {
    navLinks.push(
      {
        title: "Orders",
        path: "/orders",
        icon: <ShoppingCart className="h-5 w-5" />,
      },
      {
        title: "Returns",
        path: "/returns/shop",
        icon: <RefreshCw className="h-5 w-5" />,
      },
      {
        title: "Profile",
        path: "/profile",
        icon: <UserCircle className="h-5 w-5" />,
      }
    );
  }

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-10 transform translate-x-0 transition-transform ease-in-out duration-300 pt-16">
      <div className="h-full overflow-y-auto">
        <nav className="px-3 mt-6">
          <div className="space-y-1">
            {navLinks.map((link) => {
              // Skip links that are not applicable to the user's role
              if (link.roles && !link.roles.includes(user?.role)) return null;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`
                  }
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.title}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
