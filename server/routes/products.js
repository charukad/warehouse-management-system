// server/routes/products.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const productController = require("../controllers/productController");
const { validateProduct } = require("../middleware/validation");
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

// Special routes must come BEFORE /:id route to avoid being treated as ID parameters
// Get in-house products - accessible to all authenticated users
router.get(
  "/category/in-house",
  authenticate,
  productController.getInHouseProducts
);

// Get third-party products - accessible to all authenticated users
router.get(
  "/category/third-party",
  authenticate,
  productController.getThirdPartyProducts
);

// Get all products - accessible to all authenticated users
router.get("/", authenticate, productController.getAllProducts);

// Create product - accessible to owner only
router.post(
  "/",
  authenticate,
  authorize("owner"),
  validateProduct,
  checkValidation,
  productController.createProduct
);

// Get product by ID - accessible to all authenticated users
router.get("/:id", authenticate, productController.getProductById);

// Update product - accessible to owner only
router.put(
  "/:id",
  authenticate,
  authorize("owner"),
  validateProduct,
  checkValidation,
  productController.updateProduct
);

// Deactivate product - accessible to owner only
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("owner"),
  productController.deactivateProduct
);

// Reactivate product - accessible to owner only
router.put(
  "/:id/reactivate",
  authenticate,
  authorize("owner"),
  productController.reactivateProduct
);

module.exports = router;
