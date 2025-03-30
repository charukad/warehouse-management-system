// server/models/RestockSchedule.js
const mongoose = require("mongoose");

const RestockingScheduleSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop reference is required"],
    },
    next_restock_date: {
      type: Date,
      required: [true, "Next restock date is required"],
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "custom"],
      default: "weekly",
    },
    salesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Salesman reference is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RestockingSchedule", RestockingScheduleSchema);
