// client/src/services/supplierService.js
import apiService from "./api";

/**
 * Get all suppliers with optional filters
 * @param {Object} params - Query parameters for filtering
 * @returns {Promise<Object>} - API response
 */
const getAllSuppliers = async (params = {}) => {
  try {
    console.log("Fetching suppliers with params:", params);
    const response = await apiService.get("/suppliers", { params });
    console.log("Suppliers fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
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
 * Get a single supplier by ID
 * @param {string} id - Supplier ID
 * @returns {Promise<Object>} - API response
 */
const getSupplierById = async (id) => {
  try {
    console.log(`Fetching supplier with ID: ${id}`);
    const response = await apiService.get(`/suppliers/${id}`);
    console.log(`Supplier ${id} fetched successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error fetching supplier ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Create a new supplier
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} - API response
 */
const createSupplier = async (supplierData) => {
  try {
    console.log("Creating supplier with data:", supplierData);
    const response = await apiService.post("/suppliers", supplierData);
    console.log("Supplier created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating supplier:", error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Update a supplier
 * @param {string} id - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise<Object>} - API response
 */
const updateSupplier = async (id, supplierData) => {
  try {
    console.log(`Updating supplier ${id} with data:`, supplierData);
    const response = await apiService.put(`/suppliers/${id}`, supplierData);
    console.log(`Supplier ${id} updated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error updating supplier ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Deactivate a supplier
 * @param {string} id - Supplier ID
 * @returns {Promise<Object>} - API response
 */
const deactivateSupplier = async (id) => {
  try {
    console.log(`Deactivating supplier ${id}`);
    const response = await apiService.put(`/suppliers/${id}/deactivate`);
    console.log(`Supplier ${id} deactivated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error deactivating supplier ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

/**
 * Reactivate a supplier
 * @param {string} id - Supplier ID
 * @returns {Promise<Object>} - API response
 */
const reactivateSupplier = async (id) => {
  try {
    console.log(`Reactivating supplier ${id}`);
    const response = await apiService.put(`/suppliers/${id}/reactivate`);
    console.log(`Supplier ${id} reactivated successfully:`, response);
    return response;
  } catch (error) {
    console.error(`Error reactivating supplier ${id}:`, error);
    if (error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
    }
    throw error;
  }
};

export const supplierService = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  reactivateSupplier,
};

export default supplierService;
