class ApiResponse {
  // Success response
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  // Error response
  static error(res, message = "Error", statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  // Not found response
  static notFound(res, message = "Resource not found") {
    return this.error(res, message, 404);
  }

  // Unauthorized response
  static unauthorized(res, message = "Unauthorized access") {
    return this.error(res, message, 401);
  }

  // Forbidden response
  static forbidden(res, message = "Access forbidden") {
    return this.error(res, message, 403);
  }
}

module.exports = ApiResponse;
