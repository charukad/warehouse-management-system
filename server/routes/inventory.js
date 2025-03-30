// server/routes/inventory.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const inventoryController = require("../controllers/inventoryController");
const { validateInventoryUpdate } = require("../middleware/validation");

// Get all inventory items - accessible to owner and warehouse manager
router.get(
  "/",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  inventoryController.getAllInventory
);

// Get inventory item by product ID - accessible to all authenticated users
router.get(
  "/product/:productId",
  authenticate,
  inventoryController.getInventoryByProduct
);

// Update inventory count - accessible to warehouse manager only
router.put(
  "/product/:productId",
  authenticate,
  checkRole("warehouse_manager"),
  validateInventoryUpdate,
  inventoryController.updateInventory
);

// Get low stock items - accessible to owner and warehouse manager
router.get(
  "/low-stock",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  inventoryController.getLowStockItems
);

// Get inventory history for a product - accessible to owner and warehouse manager
router.get(
  "/history/product/:productId",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  inventoryController.getInventoryHistory
);

// Get all inventory transactions - accessible to owner and warehouse manager
router.get(
  "/transactions",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  inventoryController.getAllTransactions
);

// Record inventory transaction - accessible to warehouse manager only
router.post(
  "/transactions",
  authenticate,
  checkRole("warehouse_manager"),
  inventoryController.recordTransaction
);

// Get inventory snapshot - accessible to owner and warehouse manager
router.get(
  "/snapshot",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  inventoryController.getInventorySnapshot
);

module.exports = router;
