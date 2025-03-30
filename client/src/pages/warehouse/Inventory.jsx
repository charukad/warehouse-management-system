// client/src/pages/warehouse/Inventory.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// These imports will be used once you implement the corresponding functionality
// import { fetchInventory, updateInventory } from '../../store/slices/inventorySlice';

const Inventory = () => {
  const dispatch = useDispatch();
  const { inventory, loading, error } = useSelector((state) => state.inventory);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateQuantity, setUpdateQuantity] = useState(0);
  const [updateType, setUpdateType] = useState("add");
  const [updateReason, setUpdateReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // This would fetch inventory when the component mounts
  useEffect(() => {
    // Uncomment when you implement the inventory slice with thunks
    // dispatch(fetchInventory());
  }, [dispatch]);

  // For now, we'll use dummy data until the API is connected
  const dummyInventory = [
    {
      _id: "1",
      product: {
        _id: "1",
        product_name: "Sweet Treat A",
        product_code: "STA001",
        product_type: "in_house",
        retail_price: 250,
        min_stock_level: 50,
      },
      current_stock: 65,
      allocated_stock: 10,
      available_stock: 55,
      last_updated: "2023-05-15T10:30:00Z",
    },
    {
      _id: "2",
      product: {
        _id: "2",
        product_name: "Sweet Treat B",
        product_code: "STB002",
        product_type: "in_house",
        retail_price: 300,
        min_stock_level: 40,
      },
      current_stock: 30,
      allocated_stock: 5,
      available_stock: 25,
      last_updated: "2023-05-14T14:20:00Z",
    },
    {
      _id: "3",
      product: {
        _id: "3",
        product_name: "Third Party Sweet",
        product_code: "TPS003",
        product_type: "third_party",
        retail_price: 350,
        min_stock_level: 30,
      },
      current_stock: 20,
      allocated_stock: 8,
      available_stock: 12,
      last_updated: "2023-05-13T09:15:00Z",
    },
  ];

  // Filter inventory based on stock level status
  const filteredInventory = dummyInventory.filter((item) => {
    if (filterStatus === "all") return true;
    if (
      filterStatus === "low" &&
      item.current_stock <= item.product.min_stock_level
    )
      return true;
    if (
      filterStatus === "normal" &&
      item.current_stock > item.product.min_stock_level
    )
      return true;
    return false;
  });

  // Handle stock update
  const handleUpdateInventory = () => {
    if (!selectedItem || !updateReason) return;

    const quantity =
      updateType === "add"
        ? parseInt(updateQuantity)
        : -parseInt(updateQuantity);

    // Here you would dispatch an action to update the inventory
    // dispatch(updateInventory({
    //   productId: selectedItem.product._id,
    //   quantity,
    //   reason: updateReason
    // }));

    console.log("Update inventory:", {
      productId: selectedItem.product._id,
      quantity,
      reason: updateReason,
    });

    // Close modal and reset form
    setShowUpdateModal(false);
    setSelectedItem(null);
    setUpdateQuantity(0);
    setUpdateType("add");
    setUpdateReason("");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Inventory Management</h1>
        <select
          className="border rounded p-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="normal">Normal Stock</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allocated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  Loading inventory...
                </td>
              </tr>
            ) : filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {item.product.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {item.product.product_code}
                    </div>
                  </td>
                  // client/src/pages/warehouse/Inventory.jsx (continued)
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{item.current_stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{item.allocated_stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">{item.available_stock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.current_stock <= item.product.min_stock_level
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.current_stock <= item.product.min_stock_level
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {new Date(item.last_updated).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowUpdateModal(true);
                      }}
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  No inventory items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Update Modal */}
      {showUpdateModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Update Inventory</h2>

            <div className="mb-4">
              <p className="font-medium">{selectedItem.product.product_name}</p>
              <p className="text-sm text-gray-500">
                Current Stock: {selectedItem.current_stock}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="updateType"
                    value="add"
                    checked={updateType === "add"}
                    onChange={() => setUpdateType("add")}
                  />
                  <span className="ml-2">Add Stock</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="updateType"
                    value="remove"
                    checked={updateType === "remove"}
                    onChange={() => setUpdateType("remove")}
                  />
                  <span className="ml-2">Remove Stock</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded-md"
                min="1"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                className="w-full p-2 border rounded-md"
                value={updateReason}
                onChange={(e) => setUpdateReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="new_stock">New Stock Received</option>
                <option value="returned">Items Returned</option>
                <option value="damaged">Damaged Items</option>
                <option value="adjustment">Inventory Adjustment</option>
                <option value="expired">Expired Items</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-2"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedItem(null);
                  setUpdateQuantity(0);
                  setUpdateType("add");
                  setUpdateReason("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
                onClick={handleUpdateInventory}
                disabled={!updateQuantity || !updateReason}
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
