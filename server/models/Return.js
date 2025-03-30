// server/models/Return.js
const mongoose = require("mongoose");

const ReturnSchema = new mongoose.Schema(
  {
    return_type: {
      type: String,
      enum: ["shop", "salesman"],
      required: [true, "Return type is required"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      // Required only for shop returns
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Salesman reference is required"],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      // Not required as returns might not be linked to a specific order
    },
    return_date: {
      type: Date,
      default: Date.now,
    },
    reference_number: {
      type: String,
      unique: true,
      required: [true, "Reference number is required"],
    },
    return_reason: {
      type: String,
      required: [true, "Return reason is required"],
    },
    status: {
      type: String,
      enum: ["pending", "processed", "rejected"],
      default: "pending",
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    processed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Required when status is 'processed'
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Return", ReturnSchema);
