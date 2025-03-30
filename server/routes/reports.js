// server/routes/reports.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const reportController = require("../controllers/reportController");

// Generate financial report - accessible to owner only
router.post(
  "/financial",
  authenticate,
  checkRole(["owner"]),
  reportController.generateFinancialReport
);

// Generate inventory report - accessible to owner and warehouse manager
router.post(
  "/inventory",
  authenticate,
  checkRole(["owner", "warehouse_manager"]),
  reportController.generateInventoryReport
);

// Generate salesman report - accessible to owner only
router.post(
  "/salesman",
  authenticate,
  checkRole(["owner"]),
  reportController.generateSalesmanReport
);

// Generate product report - accessible to owner only
router.post(
  "/product",
  authenticate,
  checkRole(["owner"]),
  reportController.generateProductReport
);

module.exports = router;
