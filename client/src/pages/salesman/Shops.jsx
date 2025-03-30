// client/src/pages/salesman/Shops.jsx
import React, { useState, useEffect } from "react";

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Dummy data
  const dummyShops = [
    {
      id: "1",
      name: "Sweet Corner",
      address: "123 Main St, City",
      contact_person: "John Doe",
      phone: "123-456-7890",
      is_active: true,
      last_order_date: "2023-05-15",
      restocking_date: "2023-06-01",
    },
    {
      id: "2",
      name: "Candy Shop",
      address: "456 Oak Ave, Town",
      contact_person: "Jane Smith",
      phone: "234-567-8901",
      is_active: true,
      last_order_date: "2023-05-10",
      restocking_date: "2023-05-25",
    },
    {
      id: "3",
      name: "Sugar Rush",
      address: "789 Pine Blvd, Village",
      contact_person: "Robert Johnson",
      phone: "345-678-9012",
      is_active: false,
      last_order_date: "2023-04-20",
      restocking_date: null,
    },
  ];

  // Fetch shops on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setShops(dummyShops);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter shops based on status
  const filteredShops = shops.filter((shop) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return shop.is_active;
    if (filterStatus === "inactive") return !shop.is_active;
    return true;
  });

  // Calculate if shop needs restocking
  const needsRestocking = (shop) => {
    if (!shop.restocking_date) return false;
    const today = new Date();
    const restockDate = new Date(shop.restocking_date);
    return today >= restockDate;
  };

  // Toggle shop active status
  const toggleShopStatus = (shopId) => {
    setShops(
      shops.map((shop) =>
        shop.id === shopId ? { ...shop, is_active: !shop.is_active } : shop
      )
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Shop Management</h1>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <select
            className="p-2 border rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Shops</option>
            <option value="active">Active Shops</option>
            <option value="inactive">Inactive Shops</option>
          </select>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowAddShopModal(true)}
          >
            Register New Shop
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading shops...</p>
        </div>
      ) : filteredShops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              className={`bg-white rounded-lg shadow overflow-hidden border ${
                shop.is_active
                  ? needsRestocking(shop)
                    ? "border-red-300"
                    : "border-green-300"
                  : "border-gray-300"
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {shop.name}
                  </h2>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      shop.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {shop.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-gray-600 mt-2">{shop.address}</p>

                <div className="mt-4 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Contact:</span>{" "}
                    {shop.contact_person}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {shop.phone}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Last Order:</span>{" "}
                    {shop.last_order_date
                      ? new Date(shop.last_order_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Restock Date:</span>{" "}
                    {shop.restocking_date ? (
                      <span
                        className={
                          needsRestocking(shop)
                            ? "text-red-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(shop.restocking_date).toLocaleDateString()}
                        {needsRestocking(shop) && " (Due)"}
                      </span>
                    ) : (
                      "Not scheduled"
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-5 py-3 flex justify-between">
                <button
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  onClick={() => setSelectedShop(shop)}
                >
                  View Details
                </button>

                <button
                  className={`text-sm font-medium ${
                    shop.is_active
                      ? "text-red-600 hover:text-red-900"
                      : "text-green-600 hover:text-green-900"
                  }`}
                  onClick={() => toggleShopStatus(shop.id)}
                >
                  {shop.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            No shops found matching your criteria.
          </p>
        </div>
      )}

      {/* Modal placeholder for adding new shop - would be implemented with actual form elements */}
      {showAddShopModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Register New Shop</h2>
            <p className="text-gray-600 mb-4">
              Shop registration form would go here
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setShowAddShopModal(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded">
                Register Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal placeholder for shop details - would be implemented with actual details */}
      {selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedShop.name} Details
            </h2>
            <p className="text-gray-600 mb-4">
              Full shop details would go here
            </p>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setSelectedShop(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;
