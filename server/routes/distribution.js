// server/routes/distribution.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const distributionController = require("../controllers/distributionController");
const { validateDistribution } = require("../middleware/validation");

// Get all distributions - accessible to owner and warehouse manager
router.get(
  "/",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  distributionController.getAllDistributions
);

// Get distribution by ID - accessible to owner, warehouse manager, and the assigned salesman
router.get("/:id", authenticate, distributionController.getDistributionById);

// Create salesman distribution - accessible to warehouse manager only
router.post(
  "/salesman",
  authenticate,
  checkRole(["warehouse_manager"]),
  validateDistribution,
  distributionController.createSalesmanDistribution
);

// Create wholesale distribution - accessible to warehouse manager only
router.post(
  "/wholesale",
  authenticate,
  checkRole(["warehouse_manager"]),
  validateDistribution,
  distributionController.createWholesaleDistribution
);

// Create retail distribution - accessible to warehouse manager only
router.post(
  "/retail",
  authenticate,
  checkRole(["warehouse_manager"]),
  validateDistribution,
  distributionController.createRetailDistribution
);

// Get salesman's distributions - accessible to the salesman and warehouse manager
router.get(
  "/salesman/:salesmanId",
  authenticate,
  distributionController.getSalesmanDistributions
);

// Get current salesman's distributions - accessible to the logged in salesman
router.get(
  "/my-distributions",
  authenticate,
  checkRole(["salesman"]),
  distributionController.getCurrentSalesmanDistributions
);

// Get distribution history - accessible to owner and warehouse manager
router.get(
  "/history",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  distributionController.getDistributionHistory
);

module.exports = router;
