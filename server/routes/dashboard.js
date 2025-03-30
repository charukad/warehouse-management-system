// server/routes/dashboard.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const dashboardController = require("../controllers/dashboardController");

// Get owner dashboard data - accessible to owner only
router.get(
  "/owner",
  authenticate,
  checkRole("owner"),
  dashboardController.getOwnerDashboard
);

// Get warehouse manager dashboard data - accessible to warehouse manager only
router.get(
  "/warehouse",
  authenticate,
  checkRole("warehouse_manager"),
  dashboardController.getWarehouseDashboard
);

// Get salesman dashboard data - accessible to the specific salesman only
router.get(
  "/salesman",
  authenticate,
  checkRole("salesman"),
  dashboardController.getSalesmanDashboard
);

// Get shop dashboard data - accessible to the specific shop only
router.get(
  "/shop",
  authenticate,
  checkRole("shop"),
  dashboardController.getShopDashboard
);

// Get financial overview - accessible to owner only
router.get(
  "/financial",
  authenticate,
  checkRole("owner"),
  dashboardController.getFinancialOverview
);

// Get inventory overview - accessible to owner and warehouse manager
router.get(
  "/inventory",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  dashboardController.getInventoryOverview
);

// Get sales overview - accessible to owner only
router.get(
  "/sales",
  authenticate,
  checkRole("owner"),
  dashboardController.getSalesOverview
);

module.exports = router;
