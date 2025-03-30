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

module.exports = {
  registerValidation,
  loginValidation,
  passwordUpdateValidation,
};
