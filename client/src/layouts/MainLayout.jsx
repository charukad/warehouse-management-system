// Update the getNavItems function in MainLayout.jsx

const getNavItems = () => {
  const commonItems = [
    { path: "/profile", label: "Profile", icon: <User size={18} /> },
  ];

  let roleSpecificItems = [];

  switch (user?.role) {
    case "owner":
      roleSpecificItems = [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/owner/users", label: "User Management" },
        { path: "/owner/products", label: "Products" },
        { path: "/owner/reports", label: "Reports" },
        {
          path: "/owner/advanced-analytics",
          label: "Advanced Analytics",
          icon: <TrendingUp size={18} />,
        }, // New
        {
          path: "/owner/shops-map",
          label: "Shops Map",
          icon: <Map size={18} />,
        }, // Updated with icon
      ];
      break;
    case "warehouse_manager":
      roleSpecificItems = [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/warehouse/inventory", label: "Inventory" },
        { path: "/warehouse/distribution", label: "Distribution" },
        { path: "/warehouse/returns", label: "Returns" },
      ];
      break;
    case "salesman":
      roleSpecificItems = [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/salesman/shops", label: "Shops" },
        { path: "/salesman/deliveries", label: "Deliveries" },
        { path: "/salesman/returns", label: "Returns" },
        { path: "/salesman/map", label: "Map" },
      ];
      break;
    case "shop":
      roleSpecificItems = [
        { path: "/dashboard", label: "Dashboard" },
        { path: "/shop/orders", label: "Orders" },
        { path: "/shop/returns", label: "Returns" },
      ];
      break;
    default:
      roleSpecificItems = [];
  }

  return [...roleSpecificItems, ...commonItems];
};
