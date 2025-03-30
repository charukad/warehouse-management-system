// server/routes/shops.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const shopController = require("../controllers/shopController");
const {
  validateShop,
  validateShopUpdate,
} = require("../middleware/validation");

// Get all shops - accessible to owner and warehouse manager
router.get(
  "/",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  shopController.getAllShops
);

// Get shop by ID - accessible to owner, warehouse manager, shop itself, and assigned salesman
router.get("/:id", authenticate, shopController.getShopById);

// Create new shop - accessible to salesman only
router.post(
  "/",
  authenticate,
  checkRole(["salesman"]),
  validateShop,
  shopController.createShop
);

// Update shop details - accessible to shop itself and assigned salesman
router.put("/:id", authenticate, validateShopUpdate, shopController.updateShop);

// Deactivate shop - accessible to owner only
router.put(
  "/:id/deactivate",
  authenticate,
  checkRole(["owner"]),
  shopController.deactivateShop
);

// Reactivate shop - accessible to owner only
router.put(
  "/:id/reactivate",
  authenticate,
  checkRole(["owner"]),
  shopController.reactivateShop
);

// Get shops by territory - accessible to owner and warehouse manager
router.get(
  "/territory/:territoryId",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  shopController.getShopsByTerritory
);

// Get shops by salesman - accessible to owner, warehouse manager, and the assigned salesman
router.get(
  "/salesman/:salesmanId",
  authenticate,
  shopController.getShopsBySalesman
);

// Get nearby shops - accessible to salesman only
router.get(
  "/nearby",
  authenticate,
  checkRole(["salesman"]),
  shopController.getNearbyShops
);

// Get shops due for restocking - accessible to salesman and warehouse manager
router.get(
  "/restocking-due",
  authenticate,
  checkRole(["salesman", "warehouse_manager"]),
  shopController.getShopsDueForRestocking
);

module.exports = router;
