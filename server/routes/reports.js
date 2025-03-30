// server/routes/reports.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const reportController = require("../controllers/reportController");

// Get sales summary report - accessible to owner only
router.get(
  "/sales-summary",
  authenticate,
  checkRole("owner"),
  reportController.getSalesSummary
);

// Get product performance report - accessible to owner only
router.get(
  "/product-performance",
  authenticate,
  checkRole("owner"),
  reportController.getProductPerformance
);

// Get salesman performance report - accessible to owner only
router.get(
  "/salesman-performance",
  authenticate,
  checkRole("owner"),
  reportController.getSalesmanPerformance
);

// Get shop performance report - accessible to owner only
router.get(
  "/shop-performance",
  authenticate,
  checkRole("owner"),
  reportController.getShopPerformance
);

// Get inventory status report - accessible to owner and warehouse manager
router.get(
  "/inventory-status",
  authenticate,
  checkRole("owner", "warehouse_manager"),
  reportController.getInventoryStatus
);

// Get returns analysis report - accessible to owner only
router.get(
  "/returns-analysis",
  authenticate,
  checkRole("owner"),
  reportController.getReturnsAnalysis
);

// Get financial report - accessible to owner only
router.get(
  "/financial",
  authenticate,
  checkRole("owner"),
  reportController.getFinancialReport
);

// Get custom report - accessible to owner only
router.post(
  "/custom",
  authenticate,
  checkRole("owner"),
  reportController.generateCustomReport
);

// Export report to PDF - accessible to owner only
router.get(
  "/export/:reportType",
  authenticate,
  checkRole("owner"),
  reportController.exportReport
);

module.exports = router;
