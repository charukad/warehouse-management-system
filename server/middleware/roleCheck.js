// server/middleware/roleCheck.js
const ApiResponse = require("../utils/apiResponse");

/**
 * Middleware to check if the user has one of the allowed roles
 * @param {Array} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Make sure user exists (should be set by auth middleware)
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Authentication required");
      console.log("Aajdglksdfglkd");
    }

    const { role } = req.user;

    // Check if user's role is in the allowed roles array
    if (Array.isArray(allowedRoles) && allowedRoles.includes(role)) {
      console.log("wajdglksdfgdfssdfglkd");
      next(); // User has an allowed role, continue
    } else {
      return ApiResponse.forbidden(
        console.log("sajdglgdfgdfksdfglkd"),
        res,
        `Access denied. User role '${role}' is not authorized for this operation.`
      );
    }
  };
};

// Export as an object with a checkRole property
module.exports = { checkRole };
