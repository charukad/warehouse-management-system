// client/src/components/common/OrderFilters.jsx
import React from "react";

const OrderFilters = ({ filters, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Range
        </label>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Order Status
        </label>
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <select
          name="payment_method"
          value={filters.payment_method}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount Range
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="min_amount"
            placeholder="Min"
            value={filters.min_amount}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded-md"
          />
          <input
            type="number"
            name="max_amount"
            placeholder="Max"
            value={filters.max_amount}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded-md"
          />
        </div>
      </div>

      <button
        onClick={() =>
          onChange({
            start_date: "",
            end_date: "",
            status: "",
            payment_method: "",
            min_amount: "",
            max_amount: "",
          })
        }
        className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default OrderFilters;
