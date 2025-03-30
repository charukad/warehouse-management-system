// client/src/components/salesman/DeliveryForm.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { OfflineStorageService } from "../../services/offlineStorageService";
import { SyncService } from "../../services/syncService";
import { createOrder } from "../../store/thunks/orderThunks";
import { v4 as uuidv4 } from "uuid"; // For generating local IDs

function DeliveryForm() {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shop_id: "",
    items: [{ product_id: "", quantity: 1, unit_price: 0 }],
    payment_method: "cash",
    notes: "",
  });

  const { inventory, shops, loading } = useSelector((state) => ({
    inventory: state.inventory.salesmanInventory,
    shops: state.shops.nearbyShops,
    loading: state.orders.loading,
  }));

  // Check if device is online
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    // Set up sync listeners
    SyncService.setupSyncListeners();

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  // Load cached data when offline
  useEffect(() => {
    if (!isOnline) {
      loadOfflineData();
    }
  }, [isOnline]);

  const loadOfflineData = async () => {
    try {
      // Load cached inventory and shops from IndexedDB
      const cachedInventory = await OfflineStorageService.getAllData(
        OfflineStorageService.STORES.INVENTORY
      );

      const cachedShops = await OfflineStorageService.getAllData(
        OfflineStorageService.STORES.SHOPS
      );

      // Update your Redux store or local state with this data
      // This is a simplified approach; you might need to dispatch actions
      // to update your Redux store properly
      if (cachedInventory.length > 0) {
        // Update inventory state
      }

      if (cachedShops.length > 0) {
        // Update shops state
      }
    } catch (error) {
      console.error("Error loading offline data", error);
      toast.error("Failed to load offline data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add timestamp and offline flag
      const orderData = {
        ...formData,
        created_at: new Date().toISOString(),
        offline_created: !isOnline,
        temp_id: uuidv4(), // Generate a temporary ID for offline orders
      };

      if (isOnline) {
        // If online, send to server
        await dispatch(createOrder(orderData)).unwrap();
        toast.success("Order created successfully");
        resetForm();
      } else {
        // If offline, store locally
        await OfflineStorageService.addData(
          OfflineStorageService.STORES.OFFLINE_ORDERS,
          orderData
        );

        // Also update local inventory to reflect the changes
        for (const item of orderData.items) {
          // Find the inventory item
          const inventoryItem = inventory.find(
            (inv) => inv.product_id === item.product_id
          );

          if (inventoryItem) {
            // Reduce available quantity
            const updatedInventory = {
              ...inventoryItem,
              available_quantity:
                inventoryItem.available_quantity - item.quantity,
            };

            // Update in IndexedDB
            await OfflineStorageService.upsertData(
              OfflineStorageService.STORES.INVENTORY,
              updatedInventory
            );
          }
        }

        toast.info(
          "Order saved offline. Will sync when connection is restored."
        );
        resetForm();
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      shop_id: "",
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
      payment_method: "cash",
      notes: "",
    });
  };

  // Rest of the component (form inputs, handlers, etc.)
  // ...

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create Delivery</h2>
        <div
          className={`px-3 py-1 rounded-full text-sm ${
            isOnline
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {isOnline ? "Online" : "Offline Mode"}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        {/* ... */}

        <div className="mt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting
              ? "Submitting..."
              : isOnline
              ? "Create Order"
              : "Save Offline"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DeliveryForm;
