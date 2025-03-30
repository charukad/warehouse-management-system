// server/models/Product.js (updated)
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  // Existing fields...
  // Add any fields you want to search
});

// Create a text index on searchable fields
productSchema.index(
  {
    product_name: "text",
    product_code: "text",
    description: "text",
  },
  {
    weights: {
      product_name: 10,
      product_code: 5,
      description: 1,
    },
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
