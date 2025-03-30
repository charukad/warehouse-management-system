// server/controllers/inventoryController.js
const Inventory = require("../models/Inventory");
const InventoryTransaction = require("../models/InventoryTransaction");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all inventory items - matching the route in your inventory.js
const getAllInventory = async (req, res, next) => {
  try {
    // Optional query parameters for filtering and pagination
    const {
      search,
      category,
      sortBy = "productName",
      sortOrder = "asc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build pipeline to join with product information for more useful data
    const pipeline = [
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $project: {
          product: 1,
          currentStock: 1,
          lastUpdated: 1,
          minimumThreshold: 1,
          warehouseLocation: 1,
          productName: "$productInfo.product_name",
          productCode: "$productInfo.product_code",
          productType: "$productInfo.product_type",
          category: "$productInfo.category",
          retailPrice: "$productInfo.retail_price",
          wholesalePrice: "$productInfo.wholesale_price",
          belowThreshold: {
            $lt: ["$currentStock", "$minimumThreshold"],
          },
        },
      },
    ];

    // Add filters
    const matchStage = { $match: {} };

    // Search by product name or code
    if (search) {
      matchStage.$match.$or = [
        { productName: { $regex: search, $options: "i" } },
        { productCode: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by category
    if (category) {
      matchStage.$match.category = category;
    }

    // Add match stage if there are filters
    if (Object.keys(matchStage.$match).length > 0) {
      pipeline.push(matchStage);
    }

    // Count total matching items before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Inventory.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting and pagination
    pipeline.push(
      {
        $sort: {
          [sortBy]: sortOrder === "asc" ? 1 : -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      }
    );

    // Execute the pipeline
    const inventory = await Inventory.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      inventory,
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
    logger.error("Error getting inventory", error);
    next(error);
  }
};

// Get inventory by product ID - matching the route in your inventory.js
const getInventoryByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Find inventory for the product
    const inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      return ApiResponse.notFound(
        res,
        "Inventory record not found for this product"
      );
    }

    // Get product details
    const product = await Product.findById(productId);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Get recent transactions for this product
    const recentTransactions = await InventoryTransaction.find({
      product: productId,
    })
      .sort({ transactionDate: -1 })
      .limit(10)
      .populate("createdBy", "username fullName");

    return ApiResponse.success(res, {
      inventory,
      product,
      recentTransactions,
    });
  } catch (error) {
    logger.error(
      `Error getting inventory for product ${req.params.productId}`,
      error
    );
    next(error);
  }
};

// Update inventory count - matching the route in your inventory.js
const updateInventory = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.params;
    const { quantity, reason, notes } = req.body;

    if (!quantity || isNaN(quantity)) {
      return ApiResponse.error(res, "Valid quantity is required", 400);
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      inventory = new Inventory({
        product: productId,
        currentStock: 0,
        minimumThreshold: product.min_stock_level || 10,
      });
    }

    // Calculate new stock level
    const previousStock = inventory.currentStock;
    const newStockLevel = previousStock + parseInt(quantity);

    if (newStockLevel < 0) {
      await session.abortTransaction();
      return ApiResponse.error(
        res,
        "Adjustment would result in negative inventory",
        400
      );
    }

    // Update inventory
    inventory.currentStock = newStockLevel;
    inventory.lastUpdated = new Date();
    await inventory.save({ session });

    // Record transaction
    const transaction = new InventoryTransaction({
      product: productId,
      quantity: parseInt(quantity),
      transactionType: "adjustment",
      previousStock,
      newStock: newStockLevel,
      reason,
      notes,
      createdBy: req.user.id,
    });

    await transaction.save({ session });

    await session.commitTransaction();

    return ApiResponse.success(
      res,
      { inventory, transaction },
      "Inventory updated successfully"
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `Error updating inventory for product ${req.params.productId}`,
      error
    );
    next(error);
  } finally {
    session.endSession();
  }
};

// Get low stock items - matching the route in your inventory.js
const getLowStockItems = async (req, res, next) => {
  try {
    // Find inventory items below minimum threshold
    const lowStockItems = await Inventory.find({
      $expr: { $lt: ["$currentStock", "$minimumThreshold"] },
    }).populate(
      "product",
      "product_name product_code product_type retail_price wholesale_price"
    );

    return ApiResponse.success(res, { lowStockItems });
  } catch (error) {
    logger.error("Error getting low stock items", error);
    next(error);
  }
};

// Get inventory history for a product - matching the route in your inventory.js
const getInventoryHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate, limit = 20, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { product: productId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.transactionDate = {};

      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set time to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await InventoryTransaction.countDocuments(query);

    // Execute query with pagination
    const transactions = await InventoryTransaction.find(query)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "username fullName");

    // Calculate pagination information
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      transactions,
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
    logger.error(
      `Error getting inventory history for product ${req.params.productId}`,
      error
    );
    next(error);
  }
};

// Get all inventory transactions - matching the route in your inventory.js
const getAllTransactions = async (req, res, next) => {
  try {
    const {
      productId,
      transactionType,
      startDate,
      endDate,
      createdBy,
      limit = 20,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Filter by product
    if (productId) {
      query.product = productId;
    }

    // Filter by transaction type
    if (transactionType) {
      query.transactionType = transactionType;
    }

    // Filter by creator
    if (createdBy) {
      query.createdBy = createdBy;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.transactionDate = {};

      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set time to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await InventoryTransaction.countDocuments(query);

    // Execute query with pagination
    const transactions = await InventoryTransaction.find(query)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("product", "product_name product_code")
      .populate("createdBy", "username fullName");

    // Calculate pagination information
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      transactions,
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
    logger.error("Error getting all transactions", error);
    next(error);
  }
};

// Record inventory transaction - matching the route in your inventory.js
const recordTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      productId,
      quantity,
      transactionType,
      reason,
      notes,
      sourceId,
      sourceType,
      destinationId,
      destinationType,
    } = req.body;

    if (!productId || !quantity || isNaN(quantity)) {
      return ApiResponse.error(
        res,
        "Product ID and valid quantity are required",
        400
      );
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      inventory = new Inventory({
        product: productId,
        currentStock: 0,
        minimumThreshold: product.min_stock_level || 10,
      });
    }

    // Calculate new stock level based on transaction type
    const previousStock = inventory.currentStock;
    let newStockLevel;

    switch (transactionType) {
      case "purchase":
      case "production":
      case "return":
        // Increases stock
        newStockLevel = previousStock + Math.abs(parseInt(quantity));
        break;
      case "sale":
      case "waste":
        // Decreases stock
        newStockLevel = previousStock - Math.abs(parseInt(quantity));
        break;
      case "transfer":
        // May increase or decrease stock depending on direction
        newStockLevel = previousStock + parseInt(quantity);
        break;
      case "stocktake":
        // Sets the stock to the specified quantity
        newStockLevel = parseInt(quantity);
        break;
      default:
        // Default adjustment
        newStockLevel = previousStock + parseInt(quantity);
    }

    if (newStockLevel < 0) {
      await session.abortTransaction();
      return ApiResponse.error(
        res,
        "Transaction would result in negative inventory",
        400
      );
    }

    // Update inventory
    inventory.currentStock = newStockLevel;
    inventory.lastUpdated = new Date();
    if (transactionType === "stocktake") {
      inventory.lastStockTake = new Date();
    }
    await inventory.save({ session });

    // Record transaction
    const transaction = new InventoryTransaction({
      product: productId,
      quantity: parseInt(quantity),
      transactionType,
      previousStock,
      newStock: newStockLevel,
      sourceId,
      sourceType,
      destinationId,
      destinationType,
      reason,
      notes,
      createdBy: req.user.id,
    });

    await transaction.save({ session });

    await session.commitTransaction();

    return ApiResponse.success(
      res,
      { transaction, inventory },
      "Transaction recorded successfully"
    );
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error recording transaction", error);
    next(error);
  } finally {
    session.endSession();
  }
};

// Get inventory snapshot - matching the route in your inventory.js
const getInventorySnapshot = async (req, res, next) => {
  try {
    // Get total inventory value
    const inventoryValuePipeline = [
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $group: {
          _id: null,
          totalItems: { $sum: "$currentStock" },
          totalProducts: { $sum: 1 },
          retailValue: {
            $sum: { $multiply: ["$currentStock", "$productInfo.retail_price"] },
          },
          wholesaleValue: {
            $sum: {
              $multiply: ["$currentStock", "$productInfo.wholesale_price"],
            },
          },
        },
      },
    ];

    // Get inventory by product type
    const productTypePipeline = [
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $group: {
          _id: "$productInfo.product_type",
          count: { $sum: 1 },
          totalStock: { $sum: "$currentStock" },
          value: {
            $sum: { $multiply: ["$currentStock", "$productInfo.retail_price"] },
          },
        },
      },
    ];

    // Get low stock and out of stock counts
    const lowStockCount = await Inventory.countDocuments({
      $expr: { $lt: ["$currentStock", "$minimumThreshold"] },
    });

    const outOfStockCount = await Inventory.countDocuments({
      currentStock: 0,
    });

    // Execute aggregation pipelines
    const inventoryValue = await Inventory.aggregate(inventoryValuePipeline);
    const productTypeBreakdown = await Inventory.aggregate(productTypePipeline);

    // Format results
    const snapshot = {
      summary:
        inventoryValue.length > 0
          ? {
              totalItems: inventoryValue[0].totalItems,
              totalProducts: inventoryValue[0].totalProducts,
              retailValue: inventoryValue[0].retailValue,
              wholesaleValue: inventoryValue[0].wholesaleValue,
            }
          : {
              totalItems: 0,
              totalProducts: 0,
              retailValue: 0,
              wholesaleValue: 0,
            },
      lowStockCount,
      outOfStockCount,
      productTypeBreakdown,
    };

    return ApiResponse.success(res, { snapshot });
  } catch (error) {
    logger.error("Error getting inventory snapshot", error);
    next(error);
  }
};

module.exports = {
  getAllInventory,
  getInventoryByProduct,
  updateInventory,
  getLowStockItems,
  getInventoryHistory,
  getAllTransactions,
  recordTransaction,
  getInventorySnapshot,
};
