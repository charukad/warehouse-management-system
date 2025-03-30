const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * SalesmanInventory Schema
 * Tracks inventory allocated to salesmen, quantities sold and returned
 */
const salesmanInventorySchema = new Schema(
  {
    salesman: {
      type: Schema.Types.ObjectId,
      ref: "Salesman",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    allocatedQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    soldQuantity: {
      type: Number,
      default: 0,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
    },
    allocationDate: {
      type: Date,
      default: Date.now,
    },
    isReconciled: {
      type: Boolean,
      default: false,
    },
    reconciledAt: {
      type: Date,
    },
    reconciledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Create a compound index on salesman and product
//salesmanInventorySchema.index({ salesman: 1, product: 1 });

const SalesmanInventory = mongoose.model(
  "SalesmanInventory",
  salesmanInventorySchema
);

module.exports = SalesmanInventory;
