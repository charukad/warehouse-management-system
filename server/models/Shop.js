const mongoose = require("mongoose");

// Define the schema with consistent naming (I'll use ShopSchema with capital S)
const ShopSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, "Contact person name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9+\-\s]+$/, "Please provide a valid phone number"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message:
            "Invalid coordinates. Must be [longitude, latitude] within valid ranges.",
        },
      },
    },
    createdBySalesman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Salesman who created the shop must be specified"],
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastOrderDate: {
      type: Date,
      default: null,
    },
    shopType: {
      type: String,
      enum: {
        values: ["retail", "wholesale", "mixed"],
        message: "{VALUE} is not a valid shop type",
      },
      default: "retail",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: "default-shop.png",
    },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index for location-based queries
// FIXED: Use ShopSchema instead of shopSchema
ShopSchema.index(
  {
    // FIXED: Changed field names to match your schema definition
    shopName: "text",
    address: "text",
    contactPerson: "text",
    phoneNumber: "text",
  },
  {
    weights: {
      // FIXED: Changed field names to match your schema definition
      shopName: 10,
      contactPerson: 5,
      phoneNumber: 5,
      address: 1,
    },
  }
);

// FIXED: Avoiding duplicate model creation and export
// Create the model only once and export it
const Shop = mongoose.model("Shop", ShopSchema);
module.exports = Shop;
