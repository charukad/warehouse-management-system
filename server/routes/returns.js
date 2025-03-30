// server/routes/returns.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const returnController = require("../controllers/returnController");
const { validateReturn } = require("../middleware/validation");

// Get all returns - accessible to owner and warehouse manager
router.get(
  "/",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  returnController.getAllReturns
);

// Get return by ID - accessible to owner, warehouse manager, shop that placed return, and salesman who processed it
router.get("/:id", authenticate, returnController.getReturnById);

// Create shop return - accessible to salesman only
router.post(
  "/shop",
  authenticate,
  checkRole(["salesman"]),
  validateReturn,
  returnController.createShopReturn
);

// Create end-of-day salesman return - accessible to warehouse manager only
router.post(
  "/salesman",
  authenticate,
  checkRole(["warehouse_manager"]),
  validateReturn,
  returnController.createSalesmanReturn
);

// Get returns by shop - accessible to owner, warehouse manager, shop itself, and assigned salesman
router.get("/shop/:shopId", authenticate, returnController.getReturnsByShop);

// Get returns by salesman - accessible to owner, warehouse manager, and the salesman
router.get(
  "/salesman/:salesmanId",
  authenticate,
  returnController.getReturnsBySalesman
);

// Get current shop's returns - accessible to the logged in shop
router.get(
  "/my-returns",
  authenticate,
  checkRole(["shop"]),
  returnController.getCurrentShopReturns
);

// Get returns analysis - accessible to owner only
router.get(
  "/analysis",
  authenticate,
  checkRole(["owner"]),
  returnController.getReturnsAnalysis
);

module.exports = router;
