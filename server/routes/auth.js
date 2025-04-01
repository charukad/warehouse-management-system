// server/routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  passwordUpdateValidation,
} = require("../middleware/validation");

// Public routes
router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/logout", authController.logout);

// Protected routes (require authentication)
router.get("/me", authenticate, authController.getCurrentUser);
router.get("/current-user", authenticate, authController.getCurrentUser); // Added for backward compatibility
router.put(
  "/update-password",
  authenticate,
  passwordUpdateValidation,
  authController.updatePassword
);

module.exports = router;
