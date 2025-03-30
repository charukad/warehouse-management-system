// client/src/services/searchService.js
import api from "./api";

/**
 * Search products by query and filters
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - API response
 */
const searchProducts = async (query, filters = {}, options = {}) => {
  const params = {
    query,
    ...filters,
    page: options.page || 1,
    limit: options.limit || 20,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  };

  return await api.get("/search/products", { params });
};

/**
 * Search shops by query and filters
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - API response
 */
const searchShops = async (query, filters = {}, options = {}) => {
  const params = {
    query,
    ...filters,
    page: options.page || 1,
    limit: options.limit || 20,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  };

  return await api.get("/search/shops", { params });
};

/**
 * Search orders by filters
 * @param {Object} filters - Search filters
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - API response
 */
const searchOrders = async (filters = {}, options = {}) => {
  const params = {
    ...filters,
    page: options.page || 1,
    limit: options.limit || 20,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
  };

  return await api.get("/search/orders", { params });
};

/**
 * Search users by query
 * @param {string} query - Search query
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} - API response
 */
const searchUsers = async (query, options = {}) => {
  const params = {
    query,
    page: options.page || 1,
    limit: options.limit || 20,
  };

  return await api.get("/search/users", { params });
};

/**
 * Global search across multiple entities
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - API response
 */
const globalSearch = async (query, options = {}) => {
  const params = {
    query,
    limit: options.limit || 5,
  };

  return await api.get("/search/global", { params });
};

/**
 * Autocomplete search for a specific entity
 * @param {string} query - Search query
 * @param {string} entity - Entity type (product, shop, user)
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - API response
 */
const autoCompleteSearch = async (query, entity, options = {}) => {
  const params = {
    query,
    entity,
    limit: options.limit || 10,
  };

  return await api.get("/search/autocomplete", { params });
};

export const searchService = {
  searchProducts,
  searchShops,
  searchOrders,
  searchUsers,
  globalSearch,
  autoCompleteSearch,
};
