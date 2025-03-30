// client/src/pages/shop/Returns.jsx
import React, { useState, useEffect } from "react";

const ShopReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showCreateReturnModal, setShowCreateReturnModal] = useState(false);

  // Mock data for shop returns
  const mockReturns = [
    {
      id: "1",
      return_date: "2023-05-12",
      status: "completed",
      original_order: {
        id: "1",
        order_date: "2023-05-10",
      },
      salesman: {
        id: "1",
        name: "John Doe",
      },
      items: [
        {
          id: "1",
          product_name: "Sweet Treat A",
          quantity: 3,
          reason: "Damaged during delivery",
        },
        {
          id: "2",
          product_name: "Sweet Treat B",
          quantity: 2,
          reason: "Wrong product received",
        },
      ],
      total_amount: 1350,
      reason: "Products damaged in transit",
      notes: "Salesman verified the damage",
    },
    {
      id: "2",
      return_date: "2023-05-16",
      status: "pending",
      original_order: {
        id: "2",
        order_date: "2023-05-15",
      },
      salesman: {
        id: "1",
        name: "John Doe",
      },
      items: [
        {
          id: "3",
          product_name: "Third Party Sweet",
          quantity: 5,
          reason: "Quality issues",
        },
      ],
      total_amount: 1750,
      reason: "Product quality below expectations",
      notes: "Awaiting salesman pickup",
    },
  ];

  // Load returns on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReturns(mockReturns);
      setLoading(false);
    }, 1000);
  }, []);

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
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // View return details
  const handleViewReturn = (returnItem) => {
    setSelectedReturn(returnItem);
  };

  // Create new return
  const handleCreateReturn = () => {
    setShowCreateReturnModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">Returns</h1>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleCreateReturn}
        >
          Request Return
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading returns...</p>
        </div>
      ) : returns.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Order
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
              {returns.map((returnItem) => (
                <tr key={returnItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      #{returnItem.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(returnItem.return_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        returnItem.status
                      )}`}
                    >
                      {returnItem.status.charAt(0).toUpperCase() +
                        returnItem.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      Order #{returnItem.original_order.id}
                      <div className="text-xs text-gray-500">
                        {new Date(
                          returnItem.original_order.order_date
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="font-medium">
                      {formatCurrency(returnItem.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {returnItem.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleViewReturn(returnItem)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">No returns found.</p>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                Return #{selectedReturn.id}
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                  selectedReturn.status
                )}`}
              >
                {selectedReturn.status.charAt(0).toUpperCase() +
                  selectedReturn.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Return Information
                </h3>
                <p className="text-sm">
                  <span className="font-medium">Return Date:</span>{" "}
                  {new Date(selectedReturn.return_date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Original Order:</span> #
                  {selectedReturn.original_order.id}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Salesman:</span>{" "}
                  {selectedReturn.salesman.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Reason:</span>{" "}
                  {selectedReturn.reason}
                </p>
                {selectedReturn.notes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span>{" "}
                    {selectedReturn.notes}
                  </p>
                )}
              </div>
            </div>

            <h3 className="font-medium text-gray-700 mb-2">Returned Items</h3>
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedReturn.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setSelectedReturn(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Return Modal */}
      {showCreateReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Request Return</h2>

            <p className="text-gray-600 mb-4">
              This form would allow the shop to request a return for items from
              a previous order.
            </p>

            {/* This would be a form in a real application */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Order to Return Items From
                </label>
                <select className="w-full p-2 border rounded-md">
                  <option value="">Select an order</option>
                  <option value="1">Order #1 - May 10, 2023</option>
                  <option value="2">Order #2 - May 15, 2023</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Return
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="Describe the reason for your return request"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setShowCreateReturnModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => {
                  // In a real app, this would submit the form
                  setShowCreateReturnModal(false);
                  alert("Return request submitted");
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopReturns;
