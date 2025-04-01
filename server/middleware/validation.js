// server/middleware/validation.js
const { body } = require("express-validator");

// User registration validation rules
const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ max: 50 })
    .withMessage("Full name cannot exceed 50 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("contactNumber")
    .notEmpty()
    .withMessage("Contact number is required")
    .matches(/^[0-9+\-\s]+$/)
    .withMessage("Please provide a valid contact number"),

  body("role")
    .notEmpty()
    .withMessage("User role is required")
    .isIn(["owner", "warehouse_manager", "salesman", "shop"])
    .withMessage("Invalid user role"),
];

// Login validation rules
const loginValidation = [
  body("username").notEmpty().withMessage("Username or email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

// Password update validation rules
const passwordUpdateValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
];

// User update validation rules
const validateUpdateUser = [
  body("fullName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Full name cannot exceed 50 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("contactNumber")
    .optional()
    .matches(/^[0-9+\-\s]+$/)
    .withMessage("Please provide a valid contact number"),

  body("role")
    .optional()
    .isIn(["owner", "warehouse_manager", "salesman", "shop"])
    .withMessage("Invalid user role"),
];

// Product validation rules - UPDATED TO USE CAMELCASE
const validateProduct = [
  body("name").notEmpty().withMessage("Product name is required").trim(),

  body("productCode").notEmpty().withMessage("Product code is required").trim(),

  body("productType")
    .notEmpty()
    .withMessage("Product type is required")
    .isIn(["in-house", "third-party"])
    .withMessage("Product type must be either 'in-house' or 'third-party'"),

  body("retailPrice")
    .notEmpty()
    .withMessage("Retail price is required")
    .isFloat({ min: 0 })
    .withMessage("Retail price must be a positive number"),

  body("wholesalePrice")
    .notEmpty()
    .withMessage("Wholesale price is required")
    .isFloat({ min: 0 })
    .withMessage("Wholesale price must be a positive number"),

  // Conditional validation for in-house products
  body("productionCost")
    .if(body("productType").equals("in-house"))
    .notEmpty()
    .withMessage("Production cost is required for in-house products")
    .isFloat({ min: 0 })
    .withMessage("Production cost must be a positive number"),

  // Conditional validation for third-party products
  body("supplier")
    .if(body("productType").equals("third-party"))
    .notEmpty()
    .withMessage("Supplier ID is required for third-party products"),

  body("purchasePrice")
    .if(body("productType").equals("third-party"))
    .notEmpty()
    .withMessage("Purchase price is required for third-party products")
    .isFloat({ min: 0 })
    .withMessage("Purchase price must be a positive number"),
];

// Inventory update validation rules
const validateInventoryUpdate = [
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isNumeric()
    .withMessage("Quantity must be a number"),

  body("reason")
    .optional()
    .isString()
    .withMessage("Reason must be a string")
    .trim(),

  body("notes")
    .optional()
    .isString()
    .withMessage("Notes must be a string")
    .trim(),
];

// Distribution validation rules - ADDED THIS MISSING MIDDLEWARE
const validateDistribution = [
  body("items")
    .isArray()
    .withMessage("Items must be an array")
    .notEmpty()
    .withMessage("Items array cannot be empty"),

  body("items.*.product_id")
    .notEmpty()
    .withMessage("Product ID is required for each item"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("items.*.unit_price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Unit price must be a positive number"),

  // For salesman distribution
  body("salesman_id")
    .optional()
    .notEmpty()
    .withMessage("Salesman ID is required for salesman distribution"),

  // For wholesale distribution
  body("recipient_name")
    .optional()
    .notEmpty()
    .withMessage("Recipient name is required for wholesale distribution"),

  body("recipient_contact").optional(),

  // For retail distribution
  body("customer_name").optional(),

  body("payment_method")
    .optional()
    .isIn(["cash", "credit", "bank_transfer", "mobile_payment"])
    .withMessage("Invalid payment method"),

  body("notes").optional().isString().withMessage("Notes must be a string"),
];

// Shop validation rules
const validateShop = [
  body("shopName").notEmpty().withMessage("Shop name is required").trim(),

  body("address").notEmpty().withMessage("Address is required").trim(),

  body("contactPerson")
    .notEmpty()
    .withMessage("Contact person name is required")
    .trim(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[0-9+\-\s]+$/)
    .withMessage("Please provide a valid phone number"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("shopType")
    .optional()
    .isIn(["retail", "wholesale", "distributor", "other"])
    .withMessage("Invalid shop type"),
];

// Shop update validation rules
const validateShopUpdate = [
  body("shopName")
    .optional()
    .notEmpty()
    .withMessage("Shop name cannot be empty if provided")
    .trim(),

  body("address")
    .optional()
    .notEmpty()
    .withMessage("Address cannot be empty if provided")
    .trim(),

  body("contactPerson")
    .optional()
    .notEmpty()
    .withMessage("Contact person name cannot be empty if provided")
    .trim(),

  body("phone")
    .optional()
    .matches(/^[0-9+\-\s]+$/)
    .withMessage("Please provide a valid phone number"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("shopType")
    .optional()
    .isIn(["retail", "wholesale", "distributor", "other"])
    .withMessage("Invalid shop type"),
];

// Order validation rules
const validateOrder = [
  body("shopId").notEmpty().withMessage("Shop ID is required"),

  body("items")
    .isArray()
    .withMessage("Items must be an array")
    .notEmpty()
    .withMessage("Items array cannot be empty"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required for each item"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("paymentMethod")
    .optional()
    .isIn(["cash", "credit", "bank_transfer", "mobile_payment"])
    .withMessage("Invalid payment method"),

  body("notes").optional().isString().withMessage("Notes must be a string"),
];

// Return validation rules
const validateReturn = [
  body("orderId").optional().isMongoId().withMessage("Invalid order ID format"),

  body("shopId").optional().isMongoId().withMessage("Invalid shop ID format"),

  body("salesmanId")
    .optional()
    .isMongoId()
    .withMessage("Invalid salesman ID format"),

  body("items")
    .isArray()
    .withMessage("Items must be an array")
    .notEmpty()
    .withMessage("Items array cannot be empty"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required for each item"),

  body("items.*.quantity")
    .notEmpty()
    .withMessage("Quantity is required for each item")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  body("returnType")
    .notEmpty()
    .withMessage("Return type is required")
    .isIn(["shop_return", "salesman_return", "damage", "expiry"])
    .withMessage("Invalid return type"),

  body("returnReason")
    .notEmpty()
    .withMessage("Return reason is required")
    .isString()
    .withMessage("Return reason must be a string"),

  body("notes").optional().isString().withMessage("Notes must be a string"),
];

module.exports = {
  registerValidation,
  loginValidation,
  passwordUpdateValidation,
  validateUpdateUser,
  validateProduct,
  validateInventoryUpdate,
  validateDistribution,
  validateShop,
  validateShopUpdate,
  validateOrder,
  validateReturn,
  // Added this export
};
