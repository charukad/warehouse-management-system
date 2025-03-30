// client/src/pages/salesman/Deliveries.jsx
import React, { useState, useEffect } from "react";

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for deliveries
  const mockDeliveries = [
    {
      id: "1",
      shop: {
        id: "1",
        name: "Sweet Corner",
        address: "123 Main St, City",
        contact: "123-456-7890",
      },
      date: "2023-05-15",
      status: "completed",
      items: [
        {
          id: "1",
          product_name: "Sweet Treat A",
          quantity: 20,
          unit_price: 250,
        },
        {
          id: "2",
          product_name: "Sweet Treat B",
          quantity: 15,
          unit_price: 300,
        },
      ],
      total_amount: 9500,
      notes: "Delivered on time",
    },
    {
      id: "2",
      shop: {
        id: "2",
        name: "Candy Shop",
        address: "456 Oak Ave, Town",
        contact: "234-567-8901",
      },
      date: "2023-05-16",
      status: "scheduled",
      items: [
        {
          id: "1",
          product_name: "Sweet Treat A",
          quantity: 25,
          unit_price: 250,
        },
        {
          id: "3",
          product_name: "Third Party Sweet",
          quantity: 10,
          unit_price: 350,
        },
      ],
      total_amount: 9750,
      notes: "Customer requested afternoon delivery",
    },
    {
      id: "3",
      shop: {
        id: "3",
        name: "Sugar Rush",
        address: "789 Pine Blvd, Village",
        contact: "345-678-9012",
      },
      date: "2023-05-16",
      status: "in-progress",
      items: [
        {
          id: "2",
          product_name: "Sweet Treat B",
          quantity: 18,
          unit_price: 300,
        },
        {
          id: "3",
          product_name: "Third Party Sweet",
          quantity: 12,
          unit_price: 350,
        },
      ],
      total_amount: 9600,
      notes: "Shop owner will be available after 2pm",
    },
  ];

  // Load deliveries on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDeliveries(mockDeliveries);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter deliveries based on status
  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filterStatus === "all") return true;
    return delivery.status === filterStatus;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge style
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // View delivery details
  const handleViewDelivery = (delivery) => {
    setSelectedDelivery(delivery);
  };

  // Create new delivery
  const handleNewDelivery = () => {
    // In a real app, this would navigate to a delivery form
    alert("Navigate to new delivery form");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Deliveries</h1>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <select
            className="p-2 border rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Deliveries</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleNewDelivery}
          >
            New Delivery
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading deliveries...</p>
        </div>
      ) : filteredDeliveries.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {delivery.shop.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {delivery.shop.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(delivery.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        delivery.status
                      )}`}
                    >
                      {delivery.status.charAt(0).toUpperCase() +
                        delivery.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="font-medium">
                      {formatCurrency(delivery.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {delivery.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => handleViewDelivery(delivery)}
                    >
                      View
                    </button>
                    {delivery.status === "scheduled" && (
                      <button className="text-green-600 hover:text-green-900">
                        Start
                      </button>
                    )}
                    {delivery.status === "in-progress" && (
                      <button className="text-green-600 hover:text-green-900">
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            No deliveries found matching your criteria.
          </p>
        </div>
      )}

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                Delivery to {selectedDelivery.shop.name}
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                  selectedDelivery.status
                )}`}
              >
                {selectedDelivery.status.charAt(0).toUpperCase() +
                  selectedDelivery.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Shop Information
                </h3>
                <p className="text-sm">{selectedDelivery.shop.name}</p>
                <p className="text-sm">{selectedDelivery.shop.address}</p>
                <p className="text-sm">{selectedDelivery.shop.contact}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Delivery Details
                </h3>
                <p className="text-sm">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(selectedDelivery.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Notes:</span>{" "}
                  {selectedDelivery.notes || "None"}
                </p>
              </div>
            </div>

            <h3 className="font-medium text-gray-700 mb-2">Items</h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedDelivery.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td
                      colSpan="3"
                      className="px-4 py-2 text-right font-medium"
                    >
                      Total
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(selectedDelivery.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setSelectedDelivery(null)}
              >
                Close
              </button>
              {selectedDelivery.status === "scheduled" && (
                <button className="px-4 py-2 bg-green-600 text-white rounded">
                  Start Delivery
                </button>
              )}
              {selectedDelivery.status === "in-progress" && (
                <button className="px-4 py-2 bg-green-600 text-white rounded">
                  Complete Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliveries;
