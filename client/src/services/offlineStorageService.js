// client/src/services/offlineStorageService.js
const DB_NAME = "SathiraSweetOfflineDB";
const DB_VERSION = 1;

// Define object stores for different data types
const STORES = {
  OFFLINE_ORDERS: "offlineOrders",
  OFFLINE_SHOP_REGISTRATIONS: "offlineShopRegistrations",
  OFFLINE_RETURNS: "offlineReturns",
  INVENTORY: "inventory",
  SHOPS: "shops",
};

// Initialize the IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.OFFLINE_ORDERS)) {
        db.createObjectStore(STORES.OFFLINE_ORDERS, {
          keyPath: "localId",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.OFFLINE_SHOP_REGISTRATIONS)) {
        db.createObjectStore(STORES.OFFLINE_SHOP_REGISTRATIONS, {
          keyPath: "localId",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.OFFLINE_RETURNS)) {
        db.createObjectStore(STORES.OFFLINE_RETURNS, {
          keyPath: "localId",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        db.createObjectStore(STORES.INVENTORY, { keyPath: "product_id" });
      }

      if (!db.objectStoreNames.contains(STORES.SHOPS)) {
        db.createObjectStore(STORES.SHOPS, { keyPath: "shop_id" });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(`IndexedDB error: ${event.target.errorCode}`);
    };
  });
};

// Add data to a store
const addData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.add(data);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(`Error adding data to ${storeName}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Get all data from a store
const getAllData = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(`Error getting data from ${storeName}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Clear data from a store after it's been synchronized
const clearData = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(`Error clearing data from ${storeName}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Update or insert data in a store
const upsertData = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    // Check if the item exists
    let getRequest;
    if (storeName === STORES.INVENTORY) {
      getRequest = store.get(data.product_id);
    } else if (storeName === STORES.SHOPS) {
      getRequest = store.get(data.shop_id);
    } else {
      getRequest = store.get(data.localId);
    }

    getRequest.onsuccess = () => {
      let updateRequest;
      if (getRequest.result) {
        // Update existing item
        updateRequest = store.put({ ...getRequest.result, ...data });
      } else {
        // Add new item
        updateRequest = store.add(data);
      }

      updateRequest.onsuccess = () => {
        resolve(updateRequest.result);
      };

      updateRequest.onerror = () => {
        reject(`Error upserting data in ${storeName}`);
      };
    };

    getRequest.onerror = () => {
      reject(`Error checking for existing data in ${storeName}`);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

export const OfflineStorageService = {
  STORES,
  addData,
  getAllData,
  clearData,
  upsertData,
};
