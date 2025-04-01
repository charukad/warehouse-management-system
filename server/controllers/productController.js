// server/controllers/productController.js
const Product = require("../models/Product");
const InHouseProduct = require("../models/InHouseProduct");
const ThirdPartyProduct = require("../models/ThirdPartyProduct");
const Supplier = require("../models/Supplier");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all products - accessible to all authenticated users
const getAllProducts = async (req, res, next) => {
  try {
    // Optional query parameters for filtering
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query object
    const query = { isActive: true };

    // Filter by product type if provided
    if (category) {
      query.product_type = category;
    }

    // Search by name or code if provided
    if (search) {
      query.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { product_code: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by price range if provided
    if (minPrice || maxPrice) {
      query.retail_price = {};

      if (minPrice) {
        query.retail_price.$gte = parseFloat(minPrice);
      }

      if (maxPrice) {
        query.retail_price.$lte = parseFloat(maxPrice);
      }
    }

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    // Get additional details for products
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        // Get product type-specific details
        if (product.product_type === "in-house") {
          const inHouseProduct = await InHouseProduct.findOne({
            product: product._id,
          });
          if (inHouseProduct) {
            productObj.productionDetails = inHouseProduct;
          }
        } else if (product.product_type === "third-party") {
          const thirdPartyProduct = await ThirdPartyProduct.findOne({
            product: product._id,
          }).populate("supplier");
          if (thirdPartyProduct) {
            productObj.supplierDetails = thirdPartyProduct;
          }
        }

        return productObj;
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      products: productsWithDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID - accessible to all authenticated users
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product by ID
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Get product type-specific details
    let productDetails = product.toObject();

    if (product.product_type === "in-house") {
      const inHouseProduct = await InHouseProduct.findOne({
        product: product._id,
      });
      if (inHouseProduct) {
        productDetails.productionDetails = inHouseProduct;
      }
    } else if (product.product_type === "third-party") {
      const thirdPartyProduct = await ThirdPartyProduct.findOne({
        product: product._id,
      }).populate("supplier");
      if (thirdPartyProduct) {
        productDetails.supplierDetails = thirdPartyProduct;
      }
    }

    return ApiResponse.success(res, { product: productDetails });
  } catch (error) {
    next(error);
  }
};

// Create product - accessible to owner only - WITHOUT TRANSACTIONS
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      productCode,
      productType,
      retailPrice,
      wholesalePrice,
      description,
      minStockLevel,
      image,
      // In-house product fields
      productionCost,
      productionDetails,
      recipeId,
      // Third-party product fields
      supplier,
      purchasePrice,
      supplierProductCode,
    } = req.body;

    // Validate required fields based on product type
    if (productType === "in-house" && !productionCost) {
      return ApiResponse.error(
        res,
        "Production cost is required for in-house products",
        400
      );
    }

    if (productType === "third-party" && (!supplier || !purchasePrice)) {
      return ApiResponse.error(
        res,
        "Supplier ID and purchase price are required for third-party products",
        400
      );
    }

    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode });
    if (existingProduct) {
      return ApiResponse.error(res, "Product code already exists", 400);
    }

    // Create new product
    const product = new Product({
      name,
      productCode,
      productType,
      retailPrice,
      wholesalePrice,
      description,
      minStockLevel,
      image,
      created_by: req.user.id,
    });

    await product.save();

    // Create type-specific product details
    if (productType === "in-house") {
      const inHouseProduct = new InHouseProduct({
        product: product._id,
        productionCost,
        productionDetails,
        recipeId,
      });

      await inHouseProduct.save();
    } else if (productType === "third-party") {
      // Check if supplier exists
      const supplierExists = await Supplier.findById(supplier);
      if (!supplierExists) {
        // If supplier doesn't exist, delete the product we just created
        await Product.findByIdAndDelete(product._id);
        return ApiResponse.notFound(res, "Supplier not found");
      }

      const thirdPartyProduct = new ThirdPartyProduct({
        product: product._id,
        supplier,
        purchasePrice,
        supplierProductCode,
        first_stocked: new Date(),
      });

      await thirdPartyProduct.save();
    }

    // Retrieve the product with its type-specific details
    const newProduct = await getProductWithDetails(product._id);

    return ApiResponse.success(
      res,
      { product: newProduct },
      "Product created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// Helper function to get product with its type-specific details
const getProductWithDetails = async (productId) => {
  const product = await Product.findById(productId);

  if (!product) {
    return null;
  }

  const productDetails = product.toObject();

  if (product.product_type === "in-house") {
    const inHouseProduct = await InHouseProduct.findOne({
      product: product._id,
    });
    if (inHouseProduct) {
      productDetails.productionDetails = inHouseProduct;
    }
  } else if (product.product_type === "third-party") {
    const thirdPartyProduct = await ThirdPartyProduct.findOne({
      product: product._id,
    }).populate("supplier");
    if (thirdPartyProduct) {
      productDetails.supplierDetails = thirdPartyProduct;
    }
  }

  return productDetails;
};

// Update product - accessible to owner only - WITHOUT TRANSACTIONS
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find product by ID
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Prevent changing product type
    if (
      updateData.product_type &&
      updateData.product_type !== product.product_type
    ) {
      return ApiResponse.error(res, "Product type cannot be changed", 400);
    }

    // Update product with safe data
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Update type-specific product details
    if (product.product_type === "in-house" && updateData.productionDetails) {
      await InHouseProduct.findOneAndUpdate(
        { product: product._id },
        { $set: updateData.productionDetails },
        { new: true, runValidators: true, upsert: true }
      );
    } else if (
      product.product_type === "third-party" &&
      updateData.supplierDetails
    ) {
      // If supplier is changing, check if new supplier exists
      if (
        updateData.supplierDetails.supplier &&
        updateData.supplierDetails.supplier !==
          product.supplierDetails?.supplier
      ) {
        const supplier = await Supplier.findById(
          updateData.supplierDetails.supplier
        );
        if (!supplier) {
          return ApiResponse.notFound(res, "Supplier not found");
        }
      }

      await ThirdPartyProduct.findOneAndUpdate(
        { product: product._id },
        { $set: updateData.supplierDetails },
        { new: true, runValidators: true, upsert: true }
      );
    }

    // Retrieve the updated product with its type-specific details
    const productWithDetails = await getProductWithDetails(id);

    return ApiResponse.success(
      res,
      {
        product: productWithDetails,
      },
      "Product updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Deactivate product - accessible to owner only
const deactivateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product by ID
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Update product active status
    product.isActive = false;
    await product.save();

    return ApiResponse.success(
      res,
      { product },
      "Product deactivated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Reactivate product - accessible to owner only
const reactivateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product by ID
    const product = await Product.findById(id);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Update product active status
    product.isActive = true;
    await product.save();

    return ApiResponse.success(
      res,
      { product },
      "Product reactivated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get in-house products - accessible to all authenticated users
const getInHouseProducts = async (req, res, next) => {
  try {
    // Optional query parameters for pagination
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      product_type: "in-house",
      isActive: true,
    };

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Execute query with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get additional details for products
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        const inHouseProduct = await InHouseProduct.findOne({
          product: product._id,
        });
        if (inHouseProduct) {
          productObj.productionDetails = inHouseProduct;
        }

        return productObj;
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      products: productsWithDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get third-party products - accessible to all authenticated users
const getThirdPartyProducts = async (req, res, next) => {
  try {
    // Optional query parameters for pagination
    const { limit = 10, page = 1, supplier } = req.query;
    const skip = (page - 1) * limit;

    // Build query object
    const query = {
      product_type: "third-party",
      isActive: true,
    };

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Execute query with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get additional details for products
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();

        const thirdPartyProduct = await ThirdPartyProduct.findOne({
          product: product._id,
        }).populate("supplier");

        // Filter by supplier if provided
        if (
          supplier &&
          thirdPartyProduct &&
          thirdPartyProduct.supplier._id.toString() !== supplier
        ) {
          return null;
        }

        if (thirdPartyProduct) {
          productObj.supplierDetails = thirdPartyProduct;
        }

        return productObj;
      })
    );

    // Filter out null values (if filtering by supplier)
    const filteredProducts = productsWithDetails.filter(
      (product) => product !== null
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      products: filteredProducts,
      pagination: {
        total: filteredProducts.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deactivateProduct,
  reactivateProduct,
  getInHouseProducts,
  getThirdPartyProducts,
};
