// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [50, "Full name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password in queries by default
    },
    contactNumber: {
      type: String,
      trim: true,
      required: [true, "Contact number is required"],
      match: [/^[0-9+\-\s]+$/, "Please provide a valid contact number"],
    },
    role: {
      type: String,
      enum: {
        values: ["owner", "warehouse_manager", "salesman", "shop"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "User role is required"],
    },
    profileImage: {
      type: String,
      default: "default-profile.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware to hash password before saving
UserSchema.pre("save", async function (next) {
  try {
    // Only hash the password if it's modified (or new)
    if (!this.isModified("password")) {
      return next();
    }

    // Hash password with 12 rounds of salt
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass any errors to the error handler
  }
});

// Method to compare password for login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed: " + error.message);
  }
};

// Method to generate JWT token
UserSchema.methods.generateAuthToken = function () {
  try {
    return jwt.sign(
      { id: this._id, role: this.role, username: this.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  } catch (error) {
    throw new Error("Token generation failed: " + error.message);
  }
};

// Virtual field for roleDetails (will be populated based on role)
UserSchema.virtual("roleDetails", {
  ref: function () {
    switch (this.role) {
      case "owner":
        return "Owner";
      case "warehouse_manager":
        return "WarehouseManager";
      case "salesman":
        return "Salesman";
      case "shop":
        return "Shop";
      default:
        return null;
    }
  },
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

module.exports = mongoose.model("User", UserSchema);
