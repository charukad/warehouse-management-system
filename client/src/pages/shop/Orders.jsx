// client/src/pages/shop/Orders.jsx
import React, { useState, useEffect } from "react";

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for shop orders
  const mockOrders = [
    {
      id: "1",
      order_date: "2023-05-10",
      status: "delivered",
      salesman: {
        id: "1",
        name: "John Doe",
      },
      items: [
        {
          id: "1",
          product_name: "Sweet Treat A",
          quantity: 15,
          unit_price: 250,
        },
        {
          id: "2",
          product_name: "Sweet Treat B",
          quantity: 10,
          unit_price: 300,
        },
      ],
      total_amount: 6750,
      payment_method: "cash",
      delivery_date: "2023-05-11",
      notes: "Delivered as scheduled",
    },
    {
      id: "2",
      order_date: "2023-05-15",
      status: "processing",
      salesman: {
        id: "1",
        name: "John Doe",
      },
      items: [
        {
          id: "1",
          product_name: "Sweet Treat A",
          quantity: 20,
          unit_price: 250,
        },
        {
          id: "3",
          product_name: "Third Party Sweet",
          quantity: 8,
          unit_price: 350,
        },
      ],
      total_amount: 7800,
      payment_method: "credit",
      delivery_date: null,
      notes: "Expected delivery tomorrow",
    },
    {
      id: "3",
      order_date: "2023-05-18",
      status: "pending",
      salesman: {
        id: "2",
        name: "Jane Smith",
      },
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
          quantity: 15,
          unit_price: 350,
        },
      ],
      total_amount: 10650,
      payment_method: "cash",
      delivery_date: null,
      notes: "",
    },
  ];

  // Load orders on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    return order.status === filterStatus;
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
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // View order details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  // Create new order
  // client/src/pages/shop/Orders.jsx (continued)
  // Create new order
  const handleNewOrder = () => {
    // In a real app, this would navigate to an order form
    alert("Navigate to new order form");
  };

  // Cancel order
  const handleCancelOrder = (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      // In a real app, this would call your API to cancel the order
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">My Orders</h1>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <select
            className="p-2 border rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleNewOrder}
          >
            New Order
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salesman
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">#{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(order.order_date).toLocaleDateString()}
                    </div>
                    {order.delivery_date && (
                      <div className="text-xs text-gray-500">
                        Delivered:{" "}
                        {new Date(order.delivery_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{order.salesman.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="font-medium">
                      {formatCurrency(order.total_amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => handleViewOrder(order)}
                    >
                      View
                    </button>
                    {(order.status === "pending" ||
                      order.status === "processing") && (
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
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
            No orders found matching your criteria.
          </p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">
                Order #{selectedOrder.id}
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status.charAt(0).toUpperCase() +
                  selectedOrder.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Order Information
                </h3>
                <p className="text-sm">
                  <span className="font-medium">Order Date:</span>{" "}
                  {new Date(selectedOrder.order_date).toLocaleDateString()}
                </p>
                {selectedOrder.delivery_date && (
                  <p className="text-sm">
                    <span className="font-medium">Delivery Date:</span>{" "}
                    {new Date(selectedOrder.delivery_date).toLocaleDateString()}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Salesman:</span>{" "}
                  {selectedOrder.salesman.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Payment Method:</span>{" "}
                  {selectedOrder.payment_method.charAt(0).toUpperCase() +
                    selectedOrder.payment_method.slice(1)}
                </p>
                {selectedOrder.notes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span>{" "}
                    {selectedOrder.notes}
                  </p>
                )}
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
                  {selectedOrder.items.map((item) => (
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
                      {formatCurrency(selectedOrder.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
              {(selectedOrder.status === "pending" ||
                selectedOrder.status === "processing") && (
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  onClick={() => {
                    handleCancelOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
