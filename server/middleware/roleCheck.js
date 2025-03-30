// server/middleware/roleCheck.js
const ApiResponse = require("../utils/apiResponse");

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return ApiResponse.forbidden(
        res,
        `Access denied. User role '${role}' is not authorized for this operation.`
      );
    }

    next();
  };
};

module.exports = checkRole;
