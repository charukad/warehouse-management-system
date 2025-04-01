// server/routes/suppliers.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const supplierController = require("../controllers/supplierController");
const { validateSupplier } = require("../middleware/validation");
const { validationResult } = require("express-validator");

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Get all suppliers - accessible to owner
router.get(
  "/",
  authenticate,
  authorize("owner"),
  supplierController.getAllSuppliers
);

// Create supplier - accessible to owner only
router.post(
  "/",
  authenticate,
  authorize("owner"),
  validateSupplier,
  checkValidation,
  supplierController.createSupplier
);

// Get supplier by ID - accessible to owner
router.get(
  "/:id",
  authenticate,
  authorize("owner"),
  supplierController.getSupplierById
);

// Update supplier - accessible to owner only
router.put(
  "/:id",
  authenticate,
  authorize("owner"),
  validateSupplier,
  checkValidation,
  supplierController.updateSupplier
);

// Deactivate supplier - accessible to owner only
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("owner"),
  supplierController.deactivateSupplier
);

// Reactivate supplier - accessible to owner only
router.put(
  "/:id/reactivate",
  authenticate,
  authorize("owner"),
  supplierController.reactivateSupplier
);

module.exports = router;
