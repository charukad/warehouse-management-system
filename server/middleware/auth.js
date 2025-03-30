// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiResponse = require("../utils/apiResponse");

// Middleware to authenticate users with error handling
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // Or check if it exists in cookies
      token = req.cookies.token;
    }

    // If no token found, return unauthorized error
    if (!token) {
      return ApiResponse.unauthorized(
        res,
        "Authentication required. Please log in."
      );
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id from decoded token
      const user = await User.findById(decoded.id);

      // If user not found, return unauthorized
      if (!user) {
        return ApiResponse.unauthorized(res, "User no longer exists");
      }

      // If user is inactive, return forbidden
      if (!user.isActive) {
        return ApiResponse.forbidden(
          res,
          "Your account is deactivated. Please contact an administrator"
        );
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return ApiResponse.unauthorized(
          res,
          "Invalid token. Please log in again."
        );
      }

      if (error.name === "TokenExpiredError") {
        return ApiResponse.unauthorized(
          res,
          "Your session has expired. Please log in again."
        );
      }

      throw error; // Pass other errors to the global error handler
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return ApiResponse.forbidden(res, "Authorization error");
    }

    // Check if user's role is in the authorized roles
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        `User role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
