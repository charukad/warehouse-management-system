// server/models/ThirdPartyProduct.js
const mongoose = require("mongoose");

const ThirdPartyProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier reference is required"],
    },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },
    supplierProductCode: {
      type: String,
      trim: true,
    },
    leadTime: {
      type: Number, // in days
      default: 1,
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ThirdPartyProduct = mongoose.model(
  "ThirdPartyProduct",
  ThirdPartyProductSchema
);

module.exports = ThirdPartyProduct;
