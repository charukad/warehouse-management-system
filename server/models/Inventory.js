// server/models/Inventory.js
const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      unique: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    minimumThreshold: {
      type: Number,
      default: 10,
      min: [0, "Threshold cannot be negative"],
    },
    warehouseLocation: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    lastStockTake: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
//InventorySchema.index({ product: 1 });
//InventorySchema.index({ currentStock: 1 });

const Inventory = mongoose.model("Inventory", InventorySchema);

module.exports = Inventory;
