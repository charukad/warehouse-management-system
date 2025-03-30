// server/routes/users.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const userController = require("../controllers/userController");
const { validateUpdateUser } = require("../middleware/validation");
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

// Profile routes - these must come BEFORE any routes with :id parameter
router.get("/profile/me", authenticate, userController.getProfile);
router.put(
  "/profile/me",
  authenticate,
  validateUpdateUser,
  checkValidation,
  userController.updateProfile
);

// Get all users route
router.get("/", authenticate, authorize("owner"), userController.getAllUsers);

// Routes with parameters
router.get("/:id", authenticate, userController.getUserById);
router.put(
  "/:id",
  authenticate,
  validateUpdateUser,
  checkValidation,
  userController.updateUser
);

// User status management routes
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("owner"),
  userController.deactivateUser
);

router.put(
  "/:id/reactivate",
  authenticate,
  authorize("owner"),
  userController.reactivateUser
);

module.exports = router;
