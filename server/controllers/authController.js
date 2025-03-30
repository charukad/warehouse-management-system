// server/controllers/authController.js
const User = require("../models/User");
const Owner = require("../models/Owner");
const WarehouseManager = require("../models/WarehouseManager");
const Salesman = require("../models/Salesman");
const Shop = require("../models/Shop");
const ApiResponse = require("../utils/apiResponse");
const { validationResult } = require("express-validator");

// Helper function to get role-specific model
const getRoleModel = (role) => {
  switch (role) {
    case "owner":
      return Owner;
    case "warehouse_manager":
      return WarehouseManager;
    case "salesman":
      return Salesman;
    case "shop":
      return Shop;
    default:
      return null;
  }
};

// Register a new user
const register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, errors.array());
    }

    const {
      username,
      fullName,
      email,
      password,
      contactNumber,
      role,
      roleDetails, // Role-specific data
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return ApiResponse.error(
        res,
        "User already exists with this email or username",
        409
      );
    }

    // Create user
    const user = await User.create({
      username,
      fullName,
      email,
      password,
      contactNumber,
      role,
    });

    // Create role-specific record if role details provided
    if (roleDetails) {
      const RoleModel = getRoleModel(role);

      if (!RoleModel) {
        return ApiResponse.error(res, "Invalid user role", 400);
      }

      await RoleModel.create({
        user: user._id,
        ...roleDetails,
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Send success response with token
    return ApiResponse.success(
      res,
      { user: userResponse, token },
      "User registered successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, errors.array());
    }

    const { username, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({
      $or: [{ email: username }, { username }],
    }).select("+password");

    // Check if user exists
    if (!user) {
      return ApiResponse.error(res, "Invalid credentials", 401);
    }

    // Check if account is active
    if (!user.isActive) {
      return ApiResponse.forbidden(
        res,
        "Your account is deactivated. Please contact an administrator"
      );
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, "Invalid credentials", 401);
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Load role-specific details if needed
    let roleDetails = null;
    if (user.role) {
      const RoleModel = getRoleModel(user.role);
      if (RoleModel) {
        roleDetails = await RoleModel.findOne({ user: user._id });
      }
    }

    // Send success response with token
    return ApiResponse.success(
      res,
      {
        user: userResponse,
        roleDetails,
        token,
      },
      "Logged in successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Load role-specific details
    let roleDetails = null;
    if (user.role) {
      const RoleModel = getRoleModel(user.role);
      if (RoleModel) {
        roleDetails = await RoleModel.findOne({ user: user._id });
      }
    }

    return ApiResponse.success(
      res,
      { user, roleDetails },
      "User profile retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Update user password
const updatePassword = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, errors.array());
    }

    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.error(res, "Current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, null, "Password updated successfully");
  } catch (error) {
    next(error);
  }
};

// Forgot password - request reset
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return ApiResponse.error(res, "Email is required", 400);
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Always return success even if user not found (security best practice)
    if (!user) {
      return ApiResponse.success(
        res,
        null,
        "If a user with that email exists, a password reset link has been sent"
      );
    }

    // Generate reset token (this would be used to create a reset link in a real application)
    // In a production app, you would email this token to the user
    // For this demo, we'll just return it in the response
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // In a real application, you would:
    // 1. Save the reset token in the database with an expiration
    // 2. Send an email with a reset link

    return ApiResponse.success(
      res,
      { resetToken }, // In a real app, don't return this in the response
      "Password reset instructions sent if email exists"
    );
  } catch (error) {
    next(error);
  }
};

// Logout - clear cookie if using cookie-based auth
const logout = (req, res) => {
  // If using cookie-based auth
  res.clearCookie("token");

  return ApiResponse.success(res, null, "Logged out successfully");
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updatePassword,
  forgotPassword,
  logout,
};
