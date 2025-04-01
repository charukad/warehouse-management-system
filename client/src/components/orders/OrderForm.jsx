// client/src/components/orders/OrderForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Autocomplete from "../common/Autocomplete";
import { orderService } from "../../services/orderService";

const OrderForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [orderData, setOrderData] = useState({
    shop: null,
    items: [{ product: null, quantity: 1, unit_price: 0 }],
    payment_method: "cash",
    notes: "",
  });

  // Handle shop selection
  const handleShopSelect = (shop) => {
    setOrderData((prev) => ({ ...prev, shop }));
  };

  // Handle product selection
  const handleProductSelect = (product, index) => {
    const updatedItems = [...orderData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product,
      unit_price: product.retail_price,
    };

    setOrderData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Add new product line
  const addProductLine = () => {
    setOrderData((prev) => ({
      ...prev,
      items: [...prev.items, { product: null, quantity: 1, unit_price: 0 }],
    }));
  };

  // Remove product line
  const removeProductLine = (index) => {
    const updatedItems = [...orderData.items];
    updatedItems.splice(index, 1);

    setOrderData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Handle quantity change
  const handleQuantityChange = (index, value) => {
    const updatedItems = [...orderData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: parseInt(value) || 1,
    };

    setOrderData((prev) => ({ ...prev, items: updatedItems }));
  };
  // client/src/components/orders/OrderForm.jsx (continued)
  // Handle unit price change
  const handleUnitPriceChange = (index, value) => {
    const updatedItems = [...orderData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      unit_price: parseFloat(value) || 0,
    };

    setOrderData((prev) => ({ ...prev, items: updatedItems }));
  };

  // Handle general form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate order total
  const calculateTotal = () => {
    return orderData.items.reduce((total, item) => {
      return total + item.quantity * item.unit_price;
    }, 0);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!orderData.shop) {
      setError("Please select a shop");
      setLoading(false);
      return;
    }

    if (!orderData.items.every((item) => item.product)) {
      setError("Please select products for all order items");
      setLoading(false);
      return;
    }

    try {
      // Format data for submission
      const formattedData = {
        shop_id: orderData.shop._id,
        items: orderData.items.map((item) => ({
          product_id: item.product._id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        payment_method: orderData.payment_method,
        notes: orderData.notes,
      };

      // Submit to API
      const response = await orderService.createOrder(formattedData);

      // Redirect to the order detail page
      navigate(`/orders/${response.data._id}`);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create order");
      console.error("Error creating order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-medium mb-6">Create New Order</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop
          </label>
          <Autocomplete
            entity="shop"
            onSelect={handleShopSelect}
            placeholder="Search for a shop..."
          />
          {orderData.shop && (
            <div className="mt-2 p-2 bg-gray-50 rounded-md">
              <p className="font-medium">{orderData.shop.shop_name}</p>
              <p className="text-sm text-gray-500">{orderData.shop.address}</p>
              <p className="text-sm text-gray-500">
                {orderData.shop.phone_number}
              </p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Order Items
            </label>
            <button
              type="button"
              onClick={addProductLine}
              className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">
            {orderData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border rounded-md"
              >
                <div className="w-full sm:w-5/12">
                  <Autocomplete
                    entity="product"
                    onSelect={(product) => handleProductSelect(product, index)}
                    placeholder="Search for a product..."
                  />
                </div>

                <div className="w-full sm:w-2/12">
                  <label className="block text-xs text-gray-500 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(index, e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="w-full sm:w-3/12">
                  <label className="block text-xs text-gray-500 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      handleUnitPriceChange(index, e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="w-full sm:w-1/12 flex items-end justify-end h-full mt-4 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => removeProductLine(index)}
                    disabled={orderData.items.length === 1}
                    className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-300"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="w-full sm:w-1/12 text-right">
                  <label className="block text-xs text-gray-500 mb-1">
                    Total
                  </label>
                  <span className="font-medium">
                    LKR{(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <div className="text-right">
              <span className="text-sm text-gray-500">Order Total:</span>
              <div className="text-xl font-bold">
                LKR{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={orderData.payment_method}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={orderData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
//
