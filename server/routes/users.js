// server/routes/users.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const userController = require("../controllers/userController");
const { validateUpdateUser } = require("../middleware/validation");

// Get all users - only accessible to owner
router.get("/", authenticate, checkRole("owner"), userController.getAllUsers);

// Get user by ID - accessible to owner and the user themselves
router.get("/:id", authenticate, userController.getUserById);

// Update user - accessible to owner and the user themselves
router.put("/:id", authenticate, validateUpdateUser, userController.updateUser);

// Deactivate user - only accessible to owner
router.put(
  "/:id/deactivate",
  authenticate,
  checkRole("owner"),
  userController.deactivateUser
);

// Reactivate user - only accessible to owner
router.put(
  "/:id/reactivate",
  authenticate,
  checkRole("owner"),
  userController.reactivateUser
);

// Get user profile - accessible to all authenticated users
router.get("/profile/me", authenticate, userController.getProfile);

// Update user profile - accessible to all authenticated users
router.put(
  "/profile/me",
  authenticate,
  validateUpdateUser,
  userController.updateProfile
);

module.exports = router;
