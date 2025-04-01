// client/src/services/productService.js
import apiService from "./api";

/**
 * Get all products with optional filters
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} - API response
 */
const getAllProducts = async (params = {}) => {
  try {
    console.log("Fetching products with params:", params);
    const response = await apiService.get("/products", { params });
    console.log("Products fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }
    throw error;
  }
};

/**
 * Get a single product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} - API response
 */
const getProductById = async (id) => {
  try {
    console.log(`Fetching product with ID: ${id}`);
    const response = await apiService.get(`/products/${id}`);
    console.log(`Product ${id} fetched successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Create a new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} - API response
 */
const createProduct = async (productData) => {
  try {
    console.log("Creating product with data:", productData);

    // Log auth header for debugging
    const token = localStorage.getItem("token");
    console.log("Authentication token exists:", token ? "Yes" : "No");

    // Log API URL from apiService
    console.log(
      "API base URL:",
      apiService?.defaults?.baseURL || "Not available"
    );

    // Make the API call
    const response = await apiService.post("/products", productData);
    console.log("Product created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating product:", error);

    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Server response data:", error.response.data);
      console.error("Server response status:", error.response.status);
      console.error("Server response headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
    }
    console.error("Error config:", error.config);

    throw error;
  }
};

/**
 * Update a product
 * @param {string} id - Product ID
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} - API response
 */
const updateProduct = async (id, productData) => {
  try {
    console.log(`Updating product ${id} with data:`, productData);
    const response = await apiService.put(`/products/${id}`, productData);
    console.log(`Product ${id} updated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Deactivate a product
 * @param {string} id - Product ID
 * @returns {Promise<Object>} - API response
 */
const deactivateProduct = async (id) => {
  try {
    console.log(`Deactivating product ${id}`);
    const response = await apiService.put(`/products/${id}/deactivate`);
    console.log(`Product ${id} deactivated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error deactivating product ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Reactivate a product
 * @param {string} id - Product ID
 * @returns {Promise<Object>} - API response
 */
const reactivateProduct = async (id) => {
  try {
    console.log(`Reactivating product ${id}`);
    const response = await apiService.put(`/products/${id}/reactivate`);
    console.log(`Product ${id} reactivated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error reactivating product ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Get all in-house products
 * @returns {Promise<Object>} - API response
 */
const getInHouseProducts = async () => {
  try {
    console.log("Fetching in-house products");
    const response = await apiService.get("/products/category/in-house");
    console.log("In-house products fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Error fetching in-house products:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Get all third-party products
 * @param {string} supplierId - Optional supplier ID to filter by
 * @returns {Promise<Object>} - API response
 */
const getThirdPartyProducts = async (supplierId = null) => {
  try {
    const params = supplierId ? { supplier: supplierId } : {};
    console.log("Fetching third-party products with params:", params);
    const response = await apiService.get("/products/category/third-party", {
      params,
    });
    console.log("Third-party products fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Error fetching third-party products:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

export const productService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  reactivateProduct,
  getInHouseProducts,
  getThirdPartyProducts,
};

export default productService;
