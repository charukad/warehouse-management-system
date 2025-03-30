// server/models/ReturnItem.js
const mongoose = require("mongoose");

const ReturnItemSchema = new mongoose.Schema(
  {
    return: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      required: [true, "Return reference is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit_price: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    line_total: {
      type: Number,
      required: [true, "Line total is required"],
      min: [0, "Line total cannot be negative"],
    },
    condition: {
      type: String,
      enum: ["good", "damaged", "expired", "other"],
      required: [true, "Condition is required"],
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReturnItem", ReturnItemSchema);
