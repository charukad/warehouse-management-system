// server/models/InventoryTransaction.js
const mongoose = require("mongoose");

const InventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Transaction quantity is required"],
    },
    transactionType: {
      type: String,
      enum: [
        "initial",
        "purchase",
        "production",
        "sale",
        "return",
        "adjustment",
        "transfer",
        "waste",
        "stocktake",
      ],
      default: "adjustment",
    },
    previousStock: {
      type: Number,
      required: [true, "Previous stock level is required"],
    },
    newStock: {
      type: Number,
      required: [true, "New stock level is required"],
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    sourceType: {
      type: String,
      enum: ["warehouse", "supplier", "shop", "salesman", null],
      default: null,
    },
    destinationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    destinationType: {
      type: String,
      enum: ["warehouse", "shop", "salesman", "waste", null],
      default: null,
    },
    reason: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must have a creator"],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
//InventoryTransactionSchema.index({ product: 1 });
//InventoryTransactionSchema.index({ transactionDate: 1 });
//InventoryTransactionSchema.index({ transactionType: 1 });
//InventoryTransactionSchema.index({ sourceId: 1, sourceType: 1 });
//InventoryTransactionSchema.index({ destinationId: 1, destinationType: 1 });

const InventoryTransaction = mongoose.model(
  "InventoryTransaction",
  InventoryTransactionSchema
);

module.exports = InventoryTransaction;
