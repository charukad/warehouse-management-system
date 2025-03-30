// server/models/Salesman.js
const mongoose = require("mongoose");

const SalesmanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    territoryId: {
      type: String,
      required: [true, "Territory ID is required"],
    },
    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100%"],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    vehicleInfo: {
      type: String,
      trim: true,
    },
    isCurrentlyActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Salesman", SalesmanSchema);
