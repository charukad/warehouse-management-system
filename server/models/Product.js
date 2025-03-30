// server/models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      min: [0, "Retail price cannot be negative"],
    },
    wholesalePrice: {
      type: Number,
      required: [true, "Wholesale price is required"],
      min: [0, "Wholesale price cannot be negative"],
    },
    productType: {
      type: String,
      required: [true, "Product type is required"],
      enum: {
        values: ["in-house", "third-party"],
        message: "{VALUE} is not a valid product type",
      },
    },
    image: {
      type: String,
      default: "default-product.jpg",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    unitOfMeasure: {
      type: String,
      default: "pcs",
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null/undefined values
    },
  },
  {
    timestamps: true,
  }
);

// Create a text index for searching products
ProductSchema.index(
  {
    name: "text",
    productCode: "text",
    description: "text",
  },
  {
    weights: {
      name: 10,
      productCode: 5,
      description: 1,
    },
  }
);

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
