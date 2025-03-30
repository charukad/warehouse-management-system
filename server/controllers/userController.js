// server/controllers/userController.js
const User = require("../models/User");
const Owner = require("../models/Owner");
const WarehouseManager = require("../models/WarehouseManager");
const Salesman = require("../models/Salesman");
const Shop = require("../models/Shop");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

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

// Get all users - accessible to owner only
const getAllUsers = async (req, res, next) => {
  try {
    // Optional query parameters for filtering
    const { role, search, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Search by name, username, or email if provided
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Execute query with pagination
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password");

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID - accessible to owner and the user themselves
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the user is authorized to view this user
    // Owner can view any user, other users can only view themselves
    if (req.user.role !== "owner" && req.user.id !== id) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this user"
      );
    }

    // Find user by ID
    const user = await User.findById(id).select("-password");

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Get role-specific details if available
    let roleDetails = null;
    const RoleModel = getRoleModel(user.role);

    if (RoleModel) {
      roleDetails = await RoleModel.findOne({ user: user._id });
    }

    return ApiResponse.success(res, { user, roleDetails });
  } catch (error) {
    next(error);
  }
};

// Update user - accessible to owner and the user themselves
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if the user is authorized to update this user
    // Owner can update any user, other users can only update themselves
    if (req.user.role !== "owner" && req.user.id !== id) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to update this user"
      );
    }

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Prevent role change if not owner
    if (
      req.user.role !== "owner" &&
      updateData.role &&
      updateData.role !== user.role
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to change user roles"
      );
    }

    // Remove sensitive fields that shouldn't be updated directly
    const { password, role, ...safeUpdateData } = updateData;

    // Update user with safe data
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    ).select("-password");

    // If owner is changing role, handle the role-specific data
    if (req.user.role === "owner" && role && role !== user.role) {
      // Create new role-specific record if role is changed
      const NewRoleModel = getRoleModel(role);
      const OldRoleModel = getRoleModel(user.role);

      if (OldRoleModel) {
        // Remove old role-specific data
        await OldRoleModel.deleteOne({ user: user._id });
      }

      if (NewRoleModel && updateData.roleDetails) {
        // Create new role-specific record
        await NewRoleModel.create({
          user: user._id,
          ...updateData.roleDetails,
        });
      }

      // Update user role
      updatedUser.role = role;
      await updatedUser.save();
    }

    // Update role-specific details if provided
    if (updateData.roleDetails) {
      const RoleModel = getRoleModel(updatedUser.role);

      if (RoleModel) {
        await RoleModel.findOneAndUpdate(
          { user: updatedUser._id },
          { $set: updateData.roleDetails },
          { new: true, runValidators: true, upsert: true }
        );
      }
    }

    // Get updated role-specific details
    let roleDetails = null;
    const RoleModel = getRoleModel(updatedUser.role);

    if (RoleModel) {
      roleDetails = await RoleModel.findOne({ user: updatedUser._id });
    }

    return ApiResponse.success(
      res,
      {
        user: updatedUser,
        roleDetails,
      },
      "User updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Deactivate user - accessible to owner only
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Prevent owner from deactivating themselves
    if (user._id.toString() === req.user.id) {
      return ApiResponse.error(
        res,
        "You cannot deactivate your own account",
        400
      );
    }

    // Update user active status
    user.isActive = false;
    await user.save();

    return ApiResponse.success(res, { user }, "User deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// Reactivate user - accessible to owner only
const reactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user by ID
    const user = await User.findById(id);

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Update user active status
    user.isActive = true;
    await user.save();

    return ApiResponse.success(res, { user }, "User reactivated successfully");
  } catch (error) {
    next(error);
  }
};

// Get user profile - accessible to all authenticated users
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user by ID
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Get role-specific details if available
    let roleDetails = null;
    const RoleModel = getRoleModel(user.role);

    if (RoleModel) {
      roleDetails = await RoleModel.findOne({ user: user._id });
    }

    return ApiResponse.success(res, { user, roleDetails });
  } catch (error) {
    next(error);
  }
};

// Update user profile - accessible to all authenticated users
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return ApiResponse.notFound(res, "User not found");
    }

    // Remove sensitive fields that shouldn't be updated directly
    const { password, role, ...safeUpdateData } = updateData;

    // Update user with safe data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: safeUpdateData },
      { new: true, runValidators: true }
    ).select("-password");

    // Update role-specific details if provided
    if (updateData.roleDetails) {
      const RoleModel = getRoleModel(user.role);

      if (RoleModel) {
        await RoleModel.findOneAndUpdate(
          { user: user._id },
          { $set: updateData.roleDetails },
          { new: true, runValidators: true, upsert: true }
        );
      }
    }

    // Get updated role-specific details
    let roleDetails = null;
    const RoleModel = getRoleModel(updatedUser.role);

    if (RoleModel) {
      roleDetails = await RoleModel.findOne({ user: updatedUser._id });
    }

    return ApiResponse.success(
      res,
      {
        user: updatedUser,
        roleDetails,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
  getProfile,
  updateProfile,
};
