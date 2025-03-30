// server/models/Distribution.js
const mongoose = require("mongoose");

const DistributionSchema = new mongoose.Schema(
  {
    distribution_type: {
      type: String,
      enum: ["salesman", "wholesale", "retail"],
      required: [true, "Distribution type is required"],
    },
    distribution_date: {
      type: Date,
      default: Date.now,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required because wholesale and retail might not have a recipient user
    },
    recipient_name: {
      type: String,
      // For wholesale and retail customers without user accounts
    },
    recipient_contact: {
      type: String,
      // For wholesale and retail customers without user accounts
    },
    reference_number: {
      type: String,
      unique: true,
      required: [true, "Reference number is required"],
    },
    status: {
      type: String,
      enum: ["pending", "distributed", "completed", "cancelled"],
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

module.exports = mongoose.model("Distribution", DistributionSchema);
