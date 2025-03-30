// server/controllers/searchController.js
const searchService = require("../services/searchService");
const apiResponse = require("../utils/apiResponse");

/**
 * Search for products
 */
exports.searchProducts = async (req, res) => {
  try {
    const { query, ...rest } = req.query;

    // Extract pagination options
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder === "asc" ? 1 : -1,
    };

    // Extract filters
    const filters = {
      product_type: req.query.product_type,
      min_price:
        req.query.min_price !== undefined
          ? parseFloat(req.query.min_price)
          : undefined,
      max_price:
        req.query.max_price !== undefined
          ? parseFloat(req.query.max_price)
          : undefined,
      is_active: req.query.is_active,
    };

    const result = await searchService.searchProducts(query, filters, options);

    return apiResponse.success(res, "Products retrieved successfully", result);
  } catch (error) {
    console.error("Error searching products:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Search for shops
 */
exports.searchShops = async (req, res) => {
  try {
    const { query } = req.query;

    // Extract pagination options
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder === "asc" ? 1 : -1,
    };

    // Extract filters
    const filters = {
      shop_type: req.query.shop_type,
      created_by_salesman_id: req.query.salesman_id,
      is_active: req.query.is_active,
      near: req.query.near,
      maxDistance: req.query.maxDistance
        ? parseFloat(req.query.maxDistance)
        : undefined,
    };

    const result = await searchService.searchShops(query, filters, options);

    return apiResponse.success(res, "Shops retrieved successfully", result);
  } catch (error) {
    console.error("Error searching shops:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Search for orders
 */
exports.searchOrders = async (req, res) => {
  try {
    // Extract pagination options
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || "order_date",
      sortOrder: req.query.sortOrder === "asc" ? 1 : -1,
    };

    // Extract filters
    const filters = {
      shop_id: req.query.shop_id,
      salesman_id: req.query.salesman_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      status: req.query.status,
      payment_method: req.query.payment_method,
      min_amount: req.query.min_amount,
      max_amount: req.query.max_amount,
      product_id: req.query.product_id,
    };

    const result = await searchService.searchOrders(filters, options);

    return apiResponse.success(res, "Orders retrieved successfully", result);
  } catch (error) {
    console.error("Error searching orders:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Global search across multiple entities
 */
exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    const options = {
      limit: parseInt(req.query.limit) || 5,
    };

    const result = await searchService.globalSearch(query, options);

    return apiResponse.success(
      res,
      "Search results retrieved successfully",
      result
    );
  } catch (error) {
    console.error("Error performing global search:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Autocomplete search for a specific entity
 */
exports.autoCompleteSearch = async (req, res) => {
  try {
    const { query, entity } = req.query;

    if (!entity) {
      return apiResponse.badRequest(res, "Entity type is required");
    }

    const options = {
      limit: parseInt(req.query.limit) || 10,
    };

    const results = await searchService.autoCompleteSearch(
      query,
      entity,
      options
    );

    return apiResponse.success(
      res,
      "Autocomplete results retrieved successfully",
      results
    );
  } catch (error) {
    console.error("Error performing autocomplete search:", error);
    return apiResponse.error(res, error.message);
  }
};
