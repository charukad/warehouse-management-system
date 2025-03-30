// server/models/DistributionItem.js
const mongoose = require("mongoose");

const DistributionItemSchema = new mongoose.Schema(
  {
    distribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Distribution",
      required: [true, "Distribution reference is required"],
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
    total_price: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DistributionItem", DistributionItemSchema);
