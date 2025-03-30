// client/src/pages/owner/Dashboard.jsx
import React from "react";
import MainLayout from "../../layouts/MainLayout";

const OwnerDashboard = () => {
  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to the Sathira Sweet management system. Here's an overview of
          your business.
        </p>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Total Sales
            </h3>
            <p className="text-3xl font-bold text-blue-900">₹24,780</p>
            <p className="text-sm text-blue-700 mt-2">↑ 12% from last week</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Active Shops
            </h3>
            <p className="text-3xl font-bold text-green-900">42</p>
            <p className="text-sm text-green-700 mt-2">↑ 2 new this week</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Product Count
            </h3>
            <p className="text-3xl font-bold text-yellow-900">18</p>
            <p className="text-sm text-yellow-700 mt-2">3 low in stock</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              Active Salesmen
            </h3>
            <p className="text-3xl font-bold text-purple-900">4</p>
            <p className="text-sm text-purple-700 mt-2">All on duty today</p>
          </div>
        </div>

        {/* Recent activity section */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 mr-3"></div>
              <div>
                <p className="text-gray-800">
                  New shop registered by Amal Perera
                </p>
                <p className="text-sm text-gray-500">Today, 10:23 AM</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500 mr-3"></div>
              <div>
                <p className="text-gray-800">
                  Inventory update: 200 units of Milk Toffee added
                </p>
                <p className="text-sm text-gray-500">Yesterday, 2:45 PM</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-red-500 mr-3"></div>
              <div>
                <p className="text-gray-800">
                  Alert: Low stock for Chocolate Bars (20 units remaining)
                </p>
                <p className="text-sm text-gray-500">Yesterday, 11:30 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OwnerDashboard;
