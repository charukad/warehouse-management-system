// client/src/pages/salesman/Inventory.jsx
import React, { useState, useEffect } from "react";

const SalesmanInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for salesman inventory
  const mockInventory = [
    {
      id: "1",
      product_id: "1",
      product_name: "Sweet Treat A",
      product_code: "STA001",
      total_allocated: 50,
      remaining: 30,
      delivered: 20,
      returned: 0,
      retail_price: 250,
      wholesale_price: 200,
      allocation_date: "2023-05-15",
    },
    {
      id: "2",
      product_id: "2",
      product_name: "Sweet Treat B",
      product_code: "STB002",
      total_allocated: 40,
      remaining: 25,
      delivered: 15,
      returned: 0,
      retail_price: 300,
      wholesale_price: 240,
      allocation_date: "2023-05-15",
    },
    {
      id: "3",
      product_id: "3",
      product_name: "Third Party Sweet",
      product_code: "TPS003",
      total_allocated: 30,
      remaining: 18,
      delivered: 12,
      returned: 0,
      retail_price: 350,
      wholesale_price: 290,
      allocation_date: "2023-05-15",
    },
  ];

  // Load inventory on component mount
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInventory(mockInventory);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter inventory based on status
  const filteredInventory = inventory.filter((item) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "low" && item.remaining <= 10) return true;
    if (filterStatus === "normal" && item.remaining > 10) return true;
    return true;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate delivery percentage
  const calculateDeliveryPercentage = (item) => {
    if (item.total_allocated === 0) return 0;
    return Math.round((item.delivered / item.total_allocated) * 100);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-semibold mb-4 md:mb-0">My Inventory</h1>

        <div className="flex space-x-4">
          <select
            className="p-2 border rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Items</option>
            <option value="low">Low Stock (≤ 10)</option>
            <option value="normal">Normal Stock ({">"} 10)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3">Loading inventory...</p>
        </div>
      ) : filteredInventory.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Allocated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retail Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.product_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.product_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium">
                        {item.total_allocated}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.remaining <= 10
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.remaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium">
                        {item.delivered}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${calculateDeliveryPercentage(item)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-center mt-1">
                        {calculateDeliveryPercentage(item)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(item.retail_price)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(item.wholesale_price)} (wholesale)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => setSelectedProduct(item)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Items:</span>{" "}
              {inventory.length}
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Delivered:</span>{" "}
              {inventory.reduce((sum, item) => sum + item.delivered, 0)} items
            </div>
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Remaining:</span>{" "}
              {inventory.reduce((sum, item) => sum + item.remaining, 0)} items
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">
            No inventory items found matching your criteria.
          </p>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedProduct.product_name}
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Product Code:</span>
                <span className="font-medium">
                  {selectedProduct.product_code}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Allocation Date:</span>
                <span className="font-medium">
                  {new Date(
                    selectedProduct.allocation_date
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Total Allocated:</span>
                <span className="font-medium">
                  {selectedProduct.total_allocated} units
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Delivered:</span>
                <span className="font-medium">
                  {selectedProduct.delivered} units
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Returned:</span>
                <span className="font-medium">
                  {selectedProduct.returned} units
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium">
                  {selectedProduct.remaining} units
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Retail Price:</span>
                <span className="font-medium">
                  {formatCurrency(selectedProduct.retail_price)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Wholesale Price:</span>
                <span className="font-medium">
                  {formatCurrency(selectedProduct.wholesale_price)}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-600">Delivery Progress:</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${calculateDeliveryPercentage(selectedProduct)}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-right mt-1">
                  {calculateDeliveryPercentage(selectedProduct)}% of allocation
                  delivered
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 border rounded text-gray-600"
                onClick={() => setSelectedProduct(null)}
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

export default SalesmanInventory;
