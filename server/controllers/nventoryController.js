// server/controllers/inventoryController.js
const Inventory = require("../models/Inventory");
const InventoryTransaction = require("../models/InventoryTransaction");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all inventory items - accessible to owner and warehouse manager
const getAllInventory = async (req, res, next) => {
  try {
    // Optional query parameters for filtering and pagination
    const {
      category,
      search,
      lowStock,
      sortBy = "product_name",
      sortOrder = "asc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Join inventory with product data for a complete view
    const aggregationPipeline = [
      // Join with products to get product details
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind the product details array
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project fields we want to return
      {
        $project: {
          _id: 1,
          product: 1,
          current_stock: 1,
          warehouse_stock: 1,
          allocated_stock: 1,
          last_updated: 1,
          minimum_threshold: 1,
          reorder_quantity: 1,
          storage_location: 1,
          last_stocktake_date: 1,
          "productDetails._id": 1,
          "productDetails.product_name": 1,
          "productDetails.product_code": 1,
          "productDetails.product_type": 1,
          "productDetails.retail_price": 1,
          "productDetails.wholesale_price": 1,
          "productDetails.min_stock_level": 1,
          "productDetails.image_url": 1,
          "productDetails.isActive": 1,
        },
      },
    ];

    // Filter by category if provided
    if (category) {
      aggregationPipeline.push({
        $match: {
          "productDetails.product_type": category,
        },
      });
    }

    // Filter by search term if provided
    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            {
              "productDetails.product_name": { $regex: search, $options: "i" },
            },
            {
              "productDetails.product_code": { $regex: search, $options: "i" },
            },
          ],
        },
      });
    }

    // Filter low stock items if requested
    if (lowStock === "true") {
      aggregationPipeline.push({
        $match: {
          $expr: {
            $lte: ["$current_stock", "$minimum_threshold"],
          },
        },
      });
    }

    // Sort by specified field and order
    const sortField =
      sortBy === "product_name" ? "productDetails.product_name" : sortBy;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    aggregationPipeline.push({
      $sort: {
        [sortField]: sortDirection,
      },
    });

    // Add count facet for pagination
    const facetPipeline = [
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    // Execute the aggregation
    const result = await Inventory.aggregate([
      ...aggregationPipeline,
      ...facetPipeline,
    ]);

    // Extract results and metadata
    const inventory = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0 };

    // Calculate pagination data
    const total = metadata.total;
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
    next(error);
  }
};

// Get inventory item by product ID - accessible to all authenticated users
const getInventoryByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return ApiResponse.error(res, "Invalid product ID", 400);
    }

    // Find product first to verify it exists
    const product = await Product.findById(productId);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Find inventory for the product
    let inventory = await Inventory.findOne({ product: productId });

    // If no inventory record exists yet, return zeros
    if (!inventory) {
      inventory = {
        product: productId,
        current_stock: 0,
        warehouse_stock: 0,
        allocated_stock: 0,
        minimum_threshold: product.min_stock_level || 0,
        reorder_quantity: 0,
      };
    }

    // Get recent transactions for this product
    const recentTransactions = await InventoryTransaction.find({
      product: productId,
    })
      .sort({ transaction_date: -1 })
      .limit(5)
      .populate("created_by", "fullName username");

    return ApiResponse.success(res, {
      inventory,
      product,
      recentTransactions,
    });
  } catch (error) {
    next(error);
  }
};

// Update inventory count - accessible to warehouse manager only
const updateInventory = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId } = req.params;
    const { quantity, transaction_type, notes } = req.body;

    // Validate inputs
    if (!quantity || !transaction_type) {
      return ApiResponse.error(
        res,
        "Quantity and transaction type are required",
        400
      );
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return ApiResponse.error(res, "Invalid product ID", 400);
    }

    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne({ product: productId }).session(
      session
    );

    if (!inventory) {
      inventory = new Inventory({
        product: productId,
        current_stock: 0,
        warehouse_stock: 0,
        allocated_stock: 0,
        minimum_threshold: product.min_stock_level || 10,
        reorder_quantity: product.min_stock_level * 2 || 20,
      });
    }

    // Create transaction record
    const transaction = new InventoryTransaction({
      product: productId,
      transaction_date: new Date(),
      quantity,
      transaction_type,
      source_type: "warehouse",
      destination_type: "warehouse",
      created_by: req.user.id,
      notes,
    });

    await transaction.save({ session });

    // Update inventory based on transaction type
    switch (transaction_type) {
      case "stock_in":
        // Increase warehouse stock and current stock
        inventory.warehouse_stock += quantity;
        inventory.current_stock += quantity;
        break;

      case "stock_out":
        // Decrease warehouse stock and current stock
        if (inventory.warehouse_stock < quantity) {
          await session.abortTransaction();
          return ApiResponse.error(res, "Not enough stock in warehouse", 400);
        }
        inventory.warehouse_stock -= quantity;
        inventory.current_stock -= quantity;
        break;

      case "transfer_in":
        // Increase warehouse stock
        inventory.warehouse_stock += quantity;
        // Current stock remains the same as it's just a transfer
        break;

      case "transfer_out":
        // Decrease warehouse stock
        if (inventory.warehouse_stock < quantity) {
          await session.abortTransaction();
          return ApiResponse.error(res, "Not enough stock in warehouse", 400);
        }
        inventory.warehouse_stock -= quantity;
        // Current stock remains the same as it's just a transfer
        break;

      case "adjustment":
        // Direct adjustment to warehouse stock and current stock
        const oldWarehouseStock = inventory.warehouse_stock;
        const oldCurrentStock = inventory.current_stock;

        inventory.warehouse_stock += quantity; // Can be negative for reduction
        inventory.current_stock += quantity; // Can be negative for reduction

        // Prevent negative stock
        if (inventory.warehouse_stock < 0 || inventory.current_stock < 0) {
          await session.abortTransaction();
          return ApiResponse.error(
            res,
            "Adjustment would result in negative stock",
            400
          );
        }

        // Record the adjustment details in notes
        transaction.notes = `${
          notes || ""
        } Previous warehouse stock: ${oldWarehouseStock}, Current stock: ${oldCurrentStock}`;
        await transaction.save({ session });
        break;

      default:
        await session.abortTransaction();
        return ApiResponse.error(res, "Invalid transaction type", 400);
    }

    // Update last updated timestamp
    inventory.last_updated = new Date();

    await inventory.save({ session });

    await session.commitTransaction();

    return ApiResponse.success(
      res,
      {
        inventory,
        transaction,
      },
      "Inventory updated successfully"
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get low stock items - accessible to owner and warehouse manager
const getLowStockItems = async (req, res, next) => {
  try {
    // Optional query parameters
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Join inventory with product data and filter for low stock
    const aggregationPipeline = [
      // Join with products to get product details
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind the product details array
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Filter for active products and low stock
      {
        $match: {
          "productDetails.isActive": true,
          $expr: {
            $lte: ["$current_stock", "$minimum_threshold"],
          },
        },
      },
      // Add a field for stock status
      {
        $addFields: {
          stock_status: {
            $cond: {
              if: { $eq: ["$current_stock", 0] },
              then: "out_of_stock",
              else: "low_stock",
            },
          },
          stock_percentage: {
            $cond: {
              if: { $eq: ["$minimum_threshold", 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ["$current_stock", "$minimum_threshold"] },
                  100,
                ],
              },
            },
          },
        },
      },
      // Sort by stock status (out of stock first) and then by stock percentage
      {
        $sort: {
          stock_status: -1,
          stock_percentage: 1,
        },
      },
    ];

    // Add count facet for pagination
    const facetPipeline = [
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    // Execute the aggregation
    const result = await Inventory.aggregate([
      ...aggregationPipeline,
      ...facetPipeline,
    ]);

    // Extract results and metadata
    const lowStockItems = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0 };

    // Calculate pagination data
    const total = metadata.total;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      lowStockItems,
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

// Get inventory history for a product - accessible to owner and warehouse manager
const getInventoryHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return ApiResponse.error(res, "Invalid product ID", 400);
    }

    // Build query
    const query = { product: productId };

    // Add date range if provided
    if (startDate || endDate) {
      query.transaction_date = {};

      if (startDate) {
        query.transaction_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transaction_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await InventoryTransaction.countDocuments(query);

    // Execute query with pagination
    const transactions = await InventoryTransaction.find(query)
      .sort({ transaction_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("created_by", "fullName username")
      .populate("product", "product_name product_code");

    // Calculate running balance
    let runningBalance = 0;

    // If this isn't the first page, we need to calculate the initial balance
    if (page > 1) {
      // Get all transactions before this page to calculate initial balance
      const previousTransactions = await InventoryTransaction.find({
        product: productId,
        transaction_date: {
          $lte: transactions[0]?.transaction_date || new Date(),
        },
      })
        .sort({ transaction_date: -1 })
        .skip(0)
        .limit(skip);

      // Calculate the initial balance
      for (const transaction of previousTransactions) {
        if (
          ["stock_in", "transfer_in", "adjustment"].includes(
            transaction.transaction_type
          )
        ) {
          runningBalance += transaction.quantity;
        } else if (
          ["stock_out", "transfer_out"].includes(transaction.transaction_type)
        ) {
          runningBalance -= transaction.quantity;
        }
      }
    }

    // Add running balance to each transaction
    const transactionsWithBalance = transactions.map((transaction) => {
      const transObj = transaction.toObject();

      // Update running balance based on transaction type
      if (["stock_in", "transfer_in"].includes(transaction.transaction_type)) {
        runningBalance += transaction.quantity;
      } else if (
        ["stock_out", "transfer_out"].includes(transaction.transaction_type)
      ) {
        runningBalance -= transaction.quantity;
      } else if (transaction.transaction_type === "adjustment") {
        runningBalance += transaction.quantity; // Can be negative for reduction
      }

      transObj.running_balance = runningBalance;
      return transObj;
    });

    // Reverse the array to show oldest first
    const chronologicalTransactions = [...transactionsWithBalance].reverse();

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      transactions: chronologicalTransactions,
      product: chronologicalTransactions[0]?.product,
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

// Get all inventory transactions - accessible to owner and warehouse manager
const getAllTransactions = async (req, res, next) => {
  try {
    // Optional query parameters
    const {
      productId,
      transactionType,
      startDate,
      endDate,
      sortBy = "transaction_date",
      sortOrder = "desc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Filter by product if provided
    if (productId) {
      query.product = productId;
    }

    // Filter by transaction type if provided
    if (transactionType) {
      query.transaction_type = transactionType;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.transaction_date = {};

      if (startDate) {
        query.transaction_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.transaction_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await InventoryTransaction.countDocuments(query);

    // Determine sort direction
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const transactions = await InventoryTransaction.find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("product", "product_name product_code")
      .populate("created_by", "fullName username");

    // Calculate pagination data
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
    next(error);
  }
};

// Record inventory transaction - accessible to warehouse manager only
const recordTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      product_id,
      quantity,
      transaction_type,
      source_type,
      source_id,
      destination_type,
      destination_id,
      notes,
    } = req.body;

    // Validate required fields
    if (!product_id || !quantity || !transaction_type) {
      return ApiResponse.error(
        res,
        "Product ID, quantity, and transaction type are required",
        400
      );
    }

    // Validate product_id
    if (!mongoose.Types.ObjectId.isValid(product_id)) {
      return ApiResponse.error(res, "Invalid product ID", 400);
    }

    // Check if product exists
    const product = await Product.findById(product_id);

    if (!product) {
      return ApiResponse.notFound(res, "Product not found");
    }

    // Find or create inventory record
    let inventory = await Inventory.findOne({ product: product_id }).session(
      session
    );

    if (!inventory) {
      inventory = new Inventory({
        product: product_id,
        current_stock: 0,
        warehouse_stock: 0,
        allocated_stock: 0,
        minimum_threshold: product.min_stock_level || 10,
        reorder_quantity: product.min_stock_level * 2 || 20,
      });
    }

    // Create transaction record
    const transaction = new InventoryTransaction({
      product: product_id,
      transaction_date: new Date(),
      quantity,
      transaction_type,
      source_type: source_type || "warehouse",
      source_id,
      destination_type: destination_type || "warehouse",
      destination_id,
      created_by: req.user.id,
      notes,
    });

    await transaction.save({ session });

    // Update inventory based on transaction type
    switch (transaction_type) {
      case "stock_in":
        // Increase warehouse stock and current stock
        inventory.warehouse_stock += quantity;
        inventory.current_stock += quantity;
        break;

      case "stock_out":
        // Decrease warehouse stock and current stock
        if (inventory.warehouse_stock < quantity) {
          await session.abortTransaction();
          return ApiResponse.error(res, "Not enough stock in warehouse", 400);
        }
        inventory.warehouse_stock -= quantity;
        inventory.current_stock -= quantity;
        break;

      case "transfer_in":
        // If destination is warehouse, increase warehouse stock
        if (destination_type === "warehouse") {
          inventory.warehouse_stock += quantity;
        }

        // Increase current stock if it's coming from outside the system
        if (source_type !== "salesman" && source_type !== "warehouse") {
          inventory.current_stock += quantity;
        }
        break;

      case "transfer_out":
        // If source is warehouse, decrease warehouse stock
        if (source_type === "warehouse") {
          if (inventory.warehouse_stock < quantity) {
            await session.abortTransaction();
            return ApiResponse.error(res, "Not enough stock in warehouse", 400);
          }
          inventory.warehouse_stock -= quantity;
        }

        // If destination is a salesman, increase allocated stock
        if (destination_type === "salesman") {
          inventory.allocated_stock += quantity;
        }

        // Decrease current stock if it's going outside the system
        if (
          destination_type !== "salesman" &&
          destination_type !== "warehouse"
        ) {
          inventory.current_stock -= quantity;
        }
        break;

      case "adjustment":
        // Direct adjustment to warehouse stock and current stock
        const oldWarehouseStock = inventory.warehouse_stock;
        const oldCurrentStock = inventory.current_stock;

        inventory.warehouse_stock += quantity; // Can be negative for reduction
        inventory.current_stock += quantity; // Can be negative for reduction

        // Prevent negative stock
        if (inventory.warehouse_stock < 0 || inventory.current_stock < 0) {
          await session.abortTransaction();
          return ApiResponse.error(
            res,
            "Adjustment would result in negative stock",
            400
          );
        }

        // Record the adjustment details in notes
        transaction.notes = `${
          notes || ""
        } Previous warehouse stock: ${oldWarehouseStock}, Current stock: ${oldCurrentStock}`;
        await transaction.save({ session });
        break;

      default:
        await session.abortTransaction();
        return ApiResponse.error(res, "Invalid transaction type", 400);
    }

    // Update last updated timestamp
    inventory.last_updated = new Date();

    await inventory.save({ session });

    await session.commitTransaction();

    return ApiResponse.success(
      res,
      {
        inventory,
        transaction,
      },
      "Inventory transaction recorded successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get inventory snapshot - accessible to owner and warehouse manager
const getInventorySnapshot = async (req, res, next) => {
  try {
    // Get counts and summaries
    const totalProducts = await Product.countDocuments({ isActive: true });

    const lowStockCount = await Inventory.countDocuments({
      $expr: {
        $lte: ["$current_stock", "$minimum_threshold"],
      },
    });

    const outOfStockCount = await Inventory.countDocuments({
      current_stock: 0,
    });

    // Get inventory value
    const inventoryValue = await Inventory.aggregate([
      // Join with products to get pricing information
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind the product details array
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Calculate value based on product type and stock
      {
        $addFields: {
          inventory_value: {
            $multiply: ["$current_stock", "$productDetails.wholesale_price"],
          },
        },
      },
      // Group by product type and sum values
      {
        $group: {
          _id: "$productDetails.product_type",
          total_value: { $sum: "$inventory_value" },
          product_count: { $sum: 1 },
        },
      },
    ]);

    // Calculate total inventory value
    const totalInventoryValue = inventoryValue.reduce(
      (sum, item) => sum + (item.total_value || 0),
      0
    );

    // Get top 5 products by stock value
    const topProductsByValue = await Inventory.aggregate([
      // Join with products to get pricing information
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind the product details array
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Calculate value based on product type and stock
      {
        $addFields: {
          inventory_value: {
            $multiply: ["$current_stock", "$productDetails.wholesale_price"],
          },
        },
      },
      // Sort by inventory value
      {
        $sort: {
          inventory_value: -1,
        },
      },
      // Limit to top 5
      {
        $limit: 5,
      },
      // Project fields we want to return
      {
        $project: {
          product_id: "$product",
          product_name: "$productDetails.product_name",
          product_code: "$productDetails.product_code",
          current_stock: 1,
          wholesale_price: "$productDetails.wholesale_price",
          inventory_value: 1,
        },
      },
    ]);

    // Get recent transactions
    const recentTransactions = await InventoryTransaction.find()
      .sort({ transaction_date: -1 })
      .limit(5)
      .populate("product", "product_name product_code")
      .populate("created_by", "fullName username");

    return ApiResponse.success(res, {
      inventory_summary: {
        total_products: totalProducts,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_inventory_value: totalInventoryValue,
        inventory_by_type: inventoryValue,
      },
      top_products_by_value: topProductsByValue,
      recent_transactions: recentTransactions,
    });
  } catch (error) {
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
