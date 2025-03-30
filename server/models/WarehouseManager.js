// server/models/WarehouseManager.js
const mongoose = require("mongoose");

const WarehouseManagerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    warehouseLocation: {
      type: String,
      required: [true, "Warehouse location is required"],
    },
    shiftSchedule: {
      type: String,
      default: "Regular (9AM-5PM)",
    },
    inventoryAccessLevel: {
      type: Number,
      default: 2,
      min: [1, "Access level cannot be less than 1"],
      max: [3, "Access level cannot exceed 3"],
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WarehouseManager", WarehouseManagerSchema);
