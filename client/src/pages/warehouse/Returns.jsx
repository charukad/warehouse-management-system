// client/src/pages/warehouse/Returns.jsx
import React, { useState } from "react";

const Returns = () => {
  const [returnType, setReturnType] = useState("salesman");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Dummy data for development
  const salesmen = [
    { id: "1", name: "John Doe", territory: "North Zone" },
    { id: "2", name: "Jane Smith", territory: "South Zone" },
    { id: "3", name: "Robert Johnson", territory: "East Zone" },
  ];

  const shops = [
    { id: "1", name: "Sweet Corner", address: "123 Main St" },
    { id: "2", name: "Candy Shop", address: "456 Oak Ave" },
    { id: "3", name: "Sugar Rush", address: "789 Pine Blvd" },
  ];

  const products = [
    { id: "1", name: "Sweet Treat A", price: 250 },
    { id: "2", name: "Sweet Treat B", price: 300 },
    { id: "3", name: "Third Party Sweet", price: 350 },
  ];

  // Add a product to return list
  const addProduct = () => {
    setReturnItems([
      ...returnItems,
      { product: "", quantity: 1, condition: "good" },
    ]);
  };

  // Remove a product from return list
  const removeProduct = (index) => {
    const updatedItems = [...returnItems];
    updatedItems.splice(index, 1);
    setReturnItems(updatedItems);
  };

  // Update product selection
  const updateProduct = (index, field, value) => {
    const updatedItems = [...returnItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === "quantity" ? parseInt(value) || 1 : value,
    };
    setReturnItems(updatedItems);
  };

  // Submit return
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Return data:", {
        type: returnType,
        entityId: selectedEntity,
        items: returnItems,
        reason,
      });
      setLoading(false);
      alert("Return processed successfully!");
      setSelectedEntity("");
      setReturnItems([]);
      setReason("");
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Process Returns</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Return Information</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Type
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="returnType"
                  value="salesman"
                  checked={returnType === "salesman"}
                  onChange={() => {
                    setReturnType("salesman");
                    setSelectedEntity("");
                  }}
                />
                <span className="ml-2">Salesman Return</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="returnType"
                  value="shop"
                  checked={returnType === "shop"}
                  onChange={() => {
                    setReturnType("shop");
                    setSelectedEntity("");
                  }}
                />
                <span className="ml-2">Shop Return</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {returnType === "salesman" ? "Select Salesman" : "Select Shop"}
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              required
            >
              <option value="">
                {returnType === "salesman"
                  ? "Select a salesman"
                  : "Select a shop"}
              </option>
              {(returnType === "salesman" ? salesmen : shops).map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}{" "}
                  {entity.territory
                    ? `- ${entity.territory}`
                    : entity.address
                    ? `- ${entity.address}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Return
            </label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for return..."
              required
            ></textarea>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Return Items</h2>
            <button
              type="button"
              onClick={addProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          {returnItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No items added yet. Click "Add Item" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {returnItems.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-center gap-4 p-3 border rounded-md"
                >
                  <div className="w-full sm:w-5/12">
                    <label className="block text-xs text-gray-500 mb-1">
                      Product
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={item.product}
                      onChange={(e) =>
                        updateProduct(index, "product", e.target.value)
                      }
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-2/12">
                    <label className="block text-xs text-gray-500 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2 border rounded-md"
                      value={item.quantity}
                      onChange={(e) =>
                        updateProduct(index, "quantity", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="w-full sm:w-3/12">
                    <label className="block text-xs text-gray-500 mb-1">
                      Condition
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={item.condition}
                      onChange={(e) =>
                        updateProduct(index, "condition", e.target.value)
                      }
                      required
                    >
                      <option value="good">Good (Resellable)</option>
                      <option value="damaged">Damaged</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-2/12 flex justify-end">
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
              !selectedEntity || returnItems.length === 0 || !reason || loading
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Processing..." : "Process Return"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Returns;
