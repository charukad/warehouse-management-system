// server/controllers/supplierController.js
const Supplier = require("../models/Supplier");
const ThirdPartyProduct = require("../models/ThirdPartyProduct");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");

// Get all suppliers
const getAllSuppliers = async (req, res, next) => {
  try {
    // Optional query parameters for filtering
    const { search, isActive, sortBy = "name", sortOrder = "asc" } = req.query;

    // Build query object
    const query = {};

    // Filter by active status if provided
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Search by name or contact person if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Execute query with sorting
    const suppliers = await Supplier.find(query).sort({
      [sortBy]: sortDirection,
    });

    return ApiResponse.success(res, { suppliers });
  } catch (error) {
    next(error);
  }
};

// Get supplier by ID
const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find supplier by ID
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return ApiResponse.notFound(res, "Supplier not found");
    }

    // Get products from this supplier
    const products = await ThirdPartyProduct.find({ supplier: id }).populate(
      "product"
    );

    return ApiResponse.success(res, { supplier, products });
  } catch (error) {
    next(error);
  }
};

// Create supplier
const createSupplier = async (req, res, next) => {
  try {
    const {
      name,
      contactPerson,
      phoneNumber,
      email,
      address,
      website,
      notes,
      paymentTerms,
    } = req.body;

    // Create new supplier
    const supplier = new Supplier({
      name,
      contactPerson,
      phoneNumber,
      email,
      address,
      website,
      notes,
      paymentTerms,
    });

    await supplier.save();

    return ApiResponse.success(
      res,
      { supplier },
      "Supplier created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// Update supplier
const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find supplier by ID
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return ApiResponse.notFound(res, "Supplier not found");
    }

    // Update supplier with new data
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return ApiResponse.success(
      res,
      { supplier: updatedSupplier },
      "Supplier updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Deactivate supplier
const deactivateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find supplier by ID
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return ApiResponse.notFound(res, "Supplier not found");
    }

    // Check if there are active products from this supplier
    const activeProducts = await ThirdPartyProduct.find({
      supplier: id,
    }).populate({
      path: "product",
      match: { isActive: true },
    });

    const hasActiveProducts = activeProducts.some(
      (item) => item.product !== null
    );

    if (hasActiveProducts) {
      return ApiResponse.error(
        res,
        "Cannot deactivate supplier with active products. Please deactivate all products from this supplier first.",
        400
      );
    }

    // Update supplier active status
    supplier.isActive = false;
    await supplier.save();

    return ApiResponse.success(
      res,
      { supplier },
      "Supplier deactivated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Reactivate supplier
const reactivateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find supplier by ID
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return ApiResponse.notFound(res, "Supplier not found");
    }

    // Update supplier active status
    supplier.isActive = true;
    await supplier.save();

    return ApiResponse.success(
      res,
      { supplier },
      "Supplier reactivated successfully"
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  reactivateSupplier,
};
