// client/src/components/common/ProductFilters.jsx
import React from "react";

const ProductFilters = ({ filters, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Type
        </label>
        <select
          name="product_type"
          value={filters.product_type}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value="in_house">In-House</option>
          <option value="third_party">Third-Party</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="min_price"
            placeholder="Min"
            value={filters.min_price}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded-md"
          />
          <input
            type="number"
            name="max_price"
            placeholder="Max"
            value={filters.max_price}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded-md"
          />
        </div>
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
            product_type: "",
            min_price: "",
            max_price: "",
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

export default ProductFilters;
