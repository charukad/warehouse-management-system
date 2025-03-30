// server/routes/dashboard.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const dashboardController = require("../controllers/dashboardController");

// Get role-specific dashboard data based on user role
router.get("/", authenticate, dashboardController.getDashboardData);

// Get owner dashboard data - accessible to owner only
router.get(
  "/owner",
  authenticate,
  checkRole(["owner"]),
  dashboardController.getOwnerDashboard
);

// Get warehouse manager dashboard data - accessible to warehouse manager only
router.get(
  "/warehouse",
  authenticate,
  checkRole(["warehouse_manager"]),
  dashboardController.getWarehouseDashboard
);

// Get salesman dashboard data - accessible to the specific salesman only
router.get(
  "/salesman",
  authenticate,
  checkRole(["salesman"]),
  dashboardController.getSalesmanDashboard
);

// Get shop dashboard data - accessible to the specific shop only
router.get(
  "/shop",
  authenticate,
  checkRole(["shop"]),
  dashboardController.getShopDashboard
);

// Get sales summary
router.get("/sales-summary", authenticate, dashboardController.getSalesSummary);

// Get inventory summary
router.get(
  "/inventory-summary",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  dashboardController.getInventorySummary
);

// Get top products
router.get("/top-products", authenticate, dashboardController.getTopProducts);

// Get salesman performance
router.get(
  "/salesman-performance",
  authenticate,
  checkRole(["owner"]),
  dashboardController.getSalesmanPerformance
);

// Get shop performance
router.get(
  "/shop-performance",
  authenticate,
  checkRole(["owner", "salesman"]),
  dashboardController.getShopPerformance
);

// Get revenue by region
router.get(
  "/revenue-by-region",
  authenticate,
  checkRole(["owner"]),
  dashboardController.getRevenueByRegion
);

// Get financial overview
router.get(
  "/financial",
  authenticate,
  checkRole(["owner"]),
  dashboardController.getFinancialOverview
);

// Get inventory overview
router.get(
  "/inventory",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  dashboardController.getInventoryOverview
);

// Get sales overview
router.get(
  "/sales",
  authenticate,
  checkRole(["owner"]),
  dashboardController.getSalesOverview
);

module.exports = router;
