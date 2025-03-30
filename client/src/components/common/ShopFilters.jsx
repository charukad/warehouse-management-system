// client/src/components/common/ShopFilters.jsx
import React, { useEffect, useState } from "react";
import { userService } from "../../services/userService";

const ShopFilters = ({ filters, onChange }) => {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch salesmen for the dropdown
  useEffect(() => {
    const fetchSalesmen = async () => {
      setLoading(true);
      try {
        const response = await userService.getSalesmenList();
        setSalesmen(response.data);
      } catch (error) {
        console.error("Error fetching salesmen:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesmen();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shop Type
        </label>
        <select
          name="shop_type"
          value={filters.shop_type}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="distributor">Distributor</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Registered By
        </label>
        <select
          name="salesman_id"
          value={filters.salesman_id}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">All Salesmen</option>
          {loading ? (
            <option disabled>Loading salesmen...</option>
          ) : (
            salesmen.map((salesman) => (
              <option key={salesman._id} value={salesman._id}>
                {salesman.full_name}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          name="is_active"
          value={filters.is_active}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
          <option value="">All</option>
        </select>
      </div>

      <button
        onClick={() =>
          onChange({
            shop_type: "",
            salesman_id: "",
            is_active: "true",
          })
        }
        className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default ShopFilters;
