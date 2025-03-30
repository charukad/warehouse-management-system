// client/src/pages/warehouse/Distribution.jsx
import React, { useState, useEffect } from "react";

const Distribution = () => {
  const [selectedSalesman, setSelectedSalesman] = useState("");
  const [distributionItems, setDistributionItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dummy data for development
  const salesmen = [
    { id: "1", name: "John Doe", territory: "North Zone" },
    { id: "2", name: "Jane Smith", territory: "South Zone" },
    { id: "3", name: "Robert Johnson", territory: "East Zone" },
  ];

  const products = [
    { id: "1", name: "Sweet Treat A", available: 120 },
    { id: "2", name: "Sweet Treat B", available: 85 },
    { id: "3", name: "Third Party Sweet", available: 50 },
  ];

  // Add a product to distribution list
  const addProduct = () => {
    setDistributionItems([...distributionItems, { product: "", quantity: 1 }]);
  };

  // Remove a product from distribution list
  const removeProduct = (index) => {
    const updatedItems = [...distributionItems];
    updatedItems.splice(index, 1);
    setDistributionItems(updatedItems);
  };

  // Update product selection
  const updateProduct = (index, productId) => {
    const updatedItems = [...distributionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      product: productId,
    };
    setDistributionItems(updatedItems);
  };

  // Update quantity
  const updateQuantity = (index, quantity) => {
    const updatedItems = [...distributionItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: parseInt(quantity) || 1,
    };
    setDistributionItems(updatedItems);
  };

  // Submit distribution
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Distribution data:", {
        salesman: selectedSalesman,
        items: distributionItems,
      });
      setLoading(false);
      alert("Distribution processed successfully!");
      setSelectedSalesman("");
      setDistributionItems([]);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Distribute Products</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Salesman Selection</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Salesman
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedSalesman}
              onChange={(e) => setSelectedSalesman(e.target.value)}
              required
            >
              <option value="">Select a salesman</option>
              {salesmen.map((salesman) => (
                <option key={salesman.id} value={salesman.id}>
                  {salesman.name} - {salesman.territory}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Products</h2>
            <button
              type="button"
              onClick={addProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>

          {distributionItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No products added yet. Click "Add Product" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {distributionItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-4 p-3 border rounded-md"
                >
                  <div className="w-full sm:w-6/12">
                    <label className="block text-xs text-gray-500 mb-1">
                      Product
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={item.product}
                      onChange={(e) => updateProduct(index, e.target.value)}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Available: {product.available})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-3/12">
                    <label className="block text-xs text-gray-500 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2 border rounded-md"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, e.target.value)}
                      required
                    />
                  </div>

                  <div className="w-full sm:w-3/12 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              !selectedSalesman || distributionItems.length === 0 || loading
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Processing..." : "Process Distribution"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Distribution;
