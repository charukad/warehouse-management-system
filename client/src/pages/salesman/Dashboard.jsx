// client/src/pages/salesman/Dashboard.jsx
import React from "react";
import MainLayout from "../../layouts/MainLayout";

const SalesmanDashboard = () => {
  return (
    <MainLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Salesman Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to your delivery management dashboard. Here's your daily
          overview.
        </p>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Today's Deliveries
            </h3>
            <p className="text-3xl font-bold text-blue-900">12</p>
            <p className="text-sm text-blue-700 mt-2">8 completed, 4 pending</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Total Items Sold
            </h3>
            <p className="text-3xl font-bold text-green-900">125</p>
            <p className="text-sm text-green-700 mt-2">₹7,230 in sales</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              Assigned Shops
            </h3>
            <p className="text-3xl font-bold text-purple-900">18</p>
            <p className="text-sm text-purple-700 mt-2">
              3 need restocking today
            </p>
          </div>
        </div>

        {/* Map preview */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Shop Locations</h2>
            <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
              Open Full Map
            </button>
          </div>

          {/* Map placeholder - would be replaced with actual map in real implementation */}
          <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">
              Interactive map showing shop locations
            </p>
          </div>
        </div>

        {/* Shops needing attention */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Shops Needing Attention
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded">
              <div>
                <span className="font-medium">Super Market Colombo</span>
                <span className="text-sm text-red-600 ml-2">
                  Restocking overdue (5 days)
                </span>
              </div>
              <button className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">
                Schedule Visit
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded">
              <div>
                <span className="font-medium">Family Mart</span>
                <span className="text-sm text-yellow-600 ml-2">
                  Due for restocking today
                </span>
              </div>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200">
                Schedule Visit
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded">
              <div>
                <span className="font-medium">Corner Store</span>
                <span className="text-sm text-yellow-600 ml-2">
                  Running low on Milk Toffee
                </span>
              </div>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200">
                Schedule Visit
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SalesmanDashboard;
