// server/models/Owner.js
const mongoose = require("mongoose");

const OwnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    companyPosition: {
      type: String,
      default: "Owner",
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    accessLevel: {
      type: String,
      default: "full",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Owner", OwnerSchema);
