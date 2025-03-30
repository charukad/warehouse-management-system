// server/routes/products.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const productController = require("../controllers/productController");
const { validateProduct } = require("../middleware/validation");

// Get all products - accessible to all authenticated users
router.get("/", authenticate, productController.getAllProducts);

// Get product by ID - accessible to all authenticated users
router.get("/:id", authenticate, productController.getProductById);

// Create product - accessible to owner only
router.post(
  "/",
  authenticate,
  checkRole("owner"),
  validateProduct,
  productController.createProduct
);

// Update product - accessible to owner only
router.put(
  "/:id",
  authenticate,
  checkRole("owner"),
  validateProduct,
  productController.updateProduct
);

// Deactivate product - accessible to owner only
router.put(
  "/:id/deactivate",
  authenticate,
  checkRole("owner"),
  productController.deactivateProduct
);

// Reactivate product - accessible to owner only
router.put(
  "/:id/reactivate",
  authenticate,
  checkRole("owner"),
  productController.reactivateProduct
);

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

module.exports = router;
