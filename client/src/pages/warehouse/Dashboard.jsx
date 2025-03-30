// client/src/pages/warehouse/Dashboard.jsx
import React from "react";
import MainLayout from "../../layouts/MainLayout";

const WarehouseDashboard = () => {
  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Warehouse Manager Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Sathira Sweet warehouse management system. Here's an
          overview of your inventory.
        </p>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Total Inventory
            </h3>
            <p className="text-3xl font-bold text-blue-900">1,520</p>
            <p className="text-sm text-blue-700 mt-2">Across 18 products</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Low Stock Items
            </h3>
            <p className="text-3xl font-bold text-yellow-900">3</p>
            <p className="text-sm text-yellow-700 mt-2">Require restocking</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Today's Distributions
            </h3>
            <p className="text-3xl font-bold text-green-900">8</p>
            <p className="text-sm text-green-700 mt-2">2 pending returns</p>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Low Stock Alerts
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded">
              <div>
                <span className="font-medium">Milk Chocolates</span>
                <span className="text-sm text-red-600 ml-2">
                  120 items left
                </span>
              </div>
              <button className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                Restock
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded">
              <div>
                <span className="font-medium">Marshmallow</span>
                <span className="text-sm text-yellow-600 ml-2">
                  150 items left
                </span>
              </div>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200">
                Restock
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded">
              <div>
                <span className="font-medium">Chocolate Bars</span>
                <span className="text-sm text-yellow-600 ml-2">
                  200 items left
                </span>
              </div>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200">
                Restock
              </button>
            </div>
          </div>
        </div>

        {/* Recent distributions */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Distributions
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recipient
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Items
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">D001</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    2025-03-28
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Delivery Salesman
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Amal Perera
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">4</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Distributed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">D002</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    2025-03-28
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Wholesale
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Metro Stores
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">2</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Distributed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">D003</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    2025-03-29
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Retail
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Walk-in Customer
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">3</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">D004</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    2025-03-29
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Delivery Salesman
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    Saman Silva
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">5</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending Returns
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default WarehouseDashboard;
