// server/models/SalesAnalytics.js
const mongoose = require("mongoose");

const SalesAnalyticsSchema = new mongoose.Schema(
  {
    analysis_date: {
      type: Date,
      required: [true, "Analysis date is required"],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      // Not required for aggregate analytics
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      // Not required for aggregate analytics
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required for aggregate analytics
    },
    total_sales: {
      type: Number,
      default: 0,
    },
    units_sold: {
      type: Number,
      default: 0,
    },
    average_order_value: {
      type: Number,
      default: 0,
    },
    return_rate: {
      type: Number,
      default: 0,
    },
    insights: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SalesAnalytics", SalesAnalyticsSchema);
