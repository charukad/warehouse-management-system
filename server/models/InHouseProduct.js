// server/models/InHouseProduct.js
const mongoose = require("mongoose");

const InHouseProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    productionCost: {
      type: Number,
      required: [true, "Production cost is required"],
      min: [0, "Production cost cannot be negative"],
    },
    productionDetails: {
      type: String,
      trim: true,
    },
    recipeId: {
      type: String,
      trim: true,
    },
    ingredients: {
      type: [String],
      default: [],
    },
    productionTime: {
      type: Number, // in minutes
      default: 0,
    },
    batchSize: {
      type: Number,
      default: 1,
    },
    shelfLife: {
      type: Number, // in days
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

const InHouseProduct = mongoose.model("InHouseProduct", InHouseProductSchema);

module.exports = InHouseProduct;
