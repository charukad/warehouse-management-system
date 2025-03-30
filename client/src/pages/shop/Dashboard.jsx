// client/src/pages/shop/Dashboard.jsx
import React from "react";
import MainLayout from "../../layouts/MainLayout";

const ShopDashboard = () => {
  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Shop Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to your shop management portal. Here's an overview of your
          account.
        </p>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Current Inventory
            </h3>
            <p className="text-3xl font-bold text-blue-900">8</p>
            <p className="text-sm text-blue-700 mt-2">
              Different product types
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Next Delivery
            </h3>
            <p className="text-3xl font-bold text-green-900">Mar 31</p>
            <p className="text-sm text-green-700 mt-2">Tomorrow at 10:00 AM</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              Total Orders
            </h3>
            <p className="text-3xl font-bold text-purple-900">24</p>
            <p className="text-sm text-purple-700 mt-2">Last 30 days</p>
          </div>
        </div>

        {/* Current stock section */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Current Stock</h2>
            <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
              Place Order
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Current Stock
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recommended Order
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    Milk Toffee
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    5 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    45 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    Coconut Laddu
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    20 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    30 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Medium Stock
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    Jaggery Cake
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    35 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    25 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Well Stocked
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                    Marshmallow
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    12 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    25 units
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Medium Stock
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent order history */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Orders
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Order #1042</h4>
                  <p className="text-sm text-gray-500">March 28, 2025</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Delivered
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                3 products • Total: ₹2,450
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Order #1036</h4>
                  <p className="text-sm text-gray-500">March 21, 2025</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Delivered
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                5 products • Total: ₹3,670
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Order #1025</h4>
                  <p className="text-sm text-gray-500">March 14, 2025</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Delivered
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                4 products • Total: ₹2,980
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ShopDashboard;
