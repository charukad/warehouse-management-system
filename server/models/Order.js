// server/models/Order.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop reference is required"],
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Salesman reference is required"],
    },
    order_date: {
      type: Date,
      default: Date.now,
    },
    delivery_date: {
      type: Date,
    },
    reference_number: {
      type: String,
      unique: true,
      required: [true, "Reference number is required"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: ["cash", "credit", "bank_transfer", "check", "other"],
      default: "cash",
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderSchema);
