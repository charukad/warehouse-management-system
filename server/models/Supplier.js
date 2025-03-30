// server/models/Supplier.js
const mongoose = require("mongoose");

const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentTerms: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a text index for searching suppliers
SupplierSchema.index(
  {
    name: "text",
    contactPerson: "text",
  },
  {
    weights: {
      name: 10,
      contactPerson: 5,
    },
  }
);

const Supplier = mongoose.model("Supplier", SupplierSchema);

module.exports = Supplier;
