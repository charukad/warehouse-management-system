// client/src/services/syncService.js
import { OfflineStorageService } from "./offlineStorageService";
import { orderService } from "./orderService";
import { shopService } from "./shopService";
import { returnService } from "./returnService";

// Check if the device is online
const isOnline = () => {
  return navigator.onLine;
};

// Sync offline orders with the server
const syncOfflineOrders = async () => {
  if (!isOnline()) {
    return { success: false, message: "Device is offline" };
  }

  try {
    // Get all offline orders
    const offlineOrders = await OfflineStorageService.getAllData(
      OfflineStorageService.STORES.OFFLINE_ORDERS
    );

    if (offlineOrders.length === 0) {
      return { success: true, message: "No offline orders to sync" };
    }

    // Sync each order with the server
    const syncPromises = offlineOrders.map(async (order) => {
      try {
        const response = await orderService.createOrder(order);
        return { success: true, data: response, localId: order.localId };
      } catch (error) {
        return { success: false, error, localId: order.localId };
      }
    });

    const results = await Promise.all(syncPromises);

    // Clear successfully synced orders
    const successfulSyncs = results.filter((result) => result.success);
    const failedSyncs = results.filter((result) => !result.success);

    if (successfulSyncs.length > 0) {
      // Only clear orders that were successfully synced
      // This is a simplified approach; a real solution might
      // involve marking each record as synced or deleting individually
      await OfflineStorageService.clearData(
        OfflineStorageService.STORES.OFFLINE_ORDERS
      );

      // If there were failed syncs, re-add them to IndexedDB
      if (failedSyncs.length > 0) {
        for (const failedSync of failedSyncs) {
          const failedOrder = offlineOrders.find(
            (order) => order.localId === failedSync.localId
          );
          if (failedOrder) {
            await OfflineStorageService.addData(
              OfflineStorageService.STORES.OFFLINE_ORDERS,
              failedOrder
            );
          }
        }
      }
    }

    return {
      success: true,
      synced: successfulSyncs.length,
      failed: failedSyncs.length,
      details: results,
    };
  } catch (error) {
    return { success: false, error };
  }
};

// Similar functions for syncing shop registrations and returns
const syncOfflineShopRegistrations = async () => {
  // Implementation similar to syncOfflineOrders but for shop registrations
  // ...
};

const syncOfflineReturns = async () => {
  // Implementation similar to syncOfflineOrders but for returns
  // ...
};

// Sync all offline data
const syncAll = async () => {
  const orderSync = await syncOfflineOrders();
  const shopSync = await syncOfflineShopRegistrations();
  const returnSync = await syncOfflineReturns();

  return {
    orders: orderSync,
    shops: shopSync,
    returns: returnSync,
    overallSuccess: orderSync.success && shopSync.success && returnSync.success,
  };
};

// Set up listeners for online/offline events
const setupSyncListeners = () => {
  window.addEventListener("online", () => {
    console.log("Device is now online. Attempting to sync data...");
    syncAll()
      .then((result) => {
        console.log("Sync completed:", result);
        // Dispatch an event or update UI to inform the user
        const event = new CustomEvent("syncCompleted", { detail: result });
        window.dispatchEvent(event);
      })
      .catch((error) => {
        console.error("Sync failed:", error);
      });
  });

  window.addEventListener("offline", () => {
    console.log("Device is now offline. Data will be stored locally.");
    // Dispatch an event or update UI to inform the user
    const event = new CustomEvent("deviceOffline");
    window.dispatchEvent(event);
  });
};

export const SyncService = {
  isOnline,
  syncOfflineOrders,
  syncOfflineShopRegistrations,
  syncOfflineReturns,
  syncAll,
  setupSyncListeners,
};
