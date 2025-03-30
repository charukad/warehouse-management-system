// server/controllers/distributionController.js
const Distribution = require("../models/Distribution");
const DistributionItem = require("../models/DistributionItem");
const Inventory = require("../models/Inventory");
const InventoryTransaction = require("../models/InventoryTransaction");
const SalesmanInventory = require("../models/SalesmanInventory");
const User = require("../models/User");
const Salesman = require("../models/Salesman");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all distributions - accessible to owner and warehouse manager
const getAllDistributions = async (req, res, next) => {
  try {
    // Optional query parameters
    const {
      type,
      startDate,
      endDate,
      status,
      search,
      sortBy = "distribution_date",
      sortOrder = "desc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by distribution type if provided
    if (type) {
      query.distribution_type = type;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.distribution_date = {};

      if (startDate) {
        query.distribution_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.distribution_date.$lte = endDateTime;
      }
    }

    // Search by recipient name or ID
    if (search) {
      // We need to join with User model to search by recipient name
      // This will be handled in the aggregation pipeline
    }

    // Use aggregation for more complex queries with joins
    const aggregationPipeline = [
      // Match stage (our query filters)
      { $match: query },

      // Lookup recipient details
      {
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          as: "recipientDetails",
        },
      },

      // Unwind recipient details (convert array to object)
      {
        $unwind: {
          path: "$recipientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup distribution items to get count and total value
      {
        $lookup: {
          from: "distributionitems",
          localField: "_id",
          foreignField: "distribution",
          as: "items",
        },
      },

      // Add computed fields
      {
        $addFields: {
          item_count: { $size: "$items" },
          total_value: { $sum: "$items.total_price" },
        },
      },
    ];

    // Add search filter if provided
    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { "recipientDetails.fullName": { $regex: search, $options: "i" } },
            { "recipientDetails.username": { $regex: search, $options: "i" } },
            { reference_number: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add sorting
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    aggregationPipeline.push({
      $sort: { [sortBy]: sortDirection },
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
    const result = await Distribution.aggregate([
      ...aggregationPipeline,
      ...facetPipeline,
    ]);

    // Extract results and metadata
    const distributions = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0 };

    // Calculate pagination data
    const total = metadata.total;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      distributions,
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

// Get distribution by ID - accessible to owner, warehouse manager, and the assigned salesman
const getDistributionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid distribution ID", 400);
    }

    // Find distribution by ID
    const distribution = await Distribution.findById(id);

    if (!distribution) {
      return ApiResponse.notFound(res, "Distribution not found");
    }

    // Check if user is authorized to view this distribution
    // Owner and warehouse manager can view any distribution
    // Salesman can only view their own distributions
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      distribution.recipient.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this distribution"
      );
    }

    // Get distribution items
    const items = await DistributionItem.find({ distribution: id }).populate(
      "product",
      "product_name product_code retail_price wholesale_price image_url"
    );

    // Get recipient details
    const recipient = await User.findById(distribution.recipient).select(
      "username fullName email contactNumber"
    );

    // Get creator details
    const created_by = await User.findById(distribution.created_by).select(
      "username fullName"
    );

    return ApiResponse.success(res, {
      distribution,
      items,
      recipient,
      created_by,
    });
  } catch (error) {
    next(error);
  }
};

// Create salesman distribution - accessible to warehouse manager only
const createSalesmanDistribution = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { salesman_id, items, notes } = req.body;

    // Validate required fields
    if (!salesman_id || !items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.error(res, "Salesman ID and items are required", 400);
    }

    // Check if salesman exists and is a salesman
    const salesman = await User.findOne({
      _id: salesman_id,
      role: "salesman",
      isActive: true,
    });

    if (!salesman) {
      return ApiResponse.notFound(res, "Salesman not found or inactive");
    }

    // Validate items and check inventory
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return ApiResponse.error(
          res,
          "Product ID and quantity are required for each item",
          400
        );
      }

      // Check if product exists
      const product = await Product.findById(item.product_id);
      if (!product) {
        return ApiResponse.error(
          res,
          `Product with ID ${item.product_id} not found`,
          400
        );
      }

      // Check if there is enough inventory
      const inventory = await Inventory.findOne({ product: item.product_id });
      if (!inventory || inventory.warehouse_stock < item.quantity) {
        return ApiResponse.error(
          res,
          `Not enough stock for product ${product.product_name}. Available: ${
            inventory?.warehouse_stock || 0
          }`,
          400
        );
      }
    }

    // Generate reference number
    const reference_number = `DIST-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create distribution record
    const distribution = new Distribution({
      distribution_type: "salesman",
      distribution_date: new Date(),
      recipient: salesman_id,
      reference_number,
      status: "distributed",
      notes,
      created_by: req.user.id,
    });

    await distribution.save({ session });

    // Process each item
    const distributionItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // Create distribution item
      const distributionItem = new DistributionItem({
        distribution: distribution._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: product.wholesale_price,
        total_price: product.wholesale_price * item.quantity,
      });

      await distributionItem.save({ session });
      distributionItems.push(distributionItem);

      // Update inventory (decrease warehouse stock)
      const inventory = await Inventory.findOne({ product: item.product_id });

      // If no inventory record exists, create one (shouldn't happen if validation passed)
      if (!inventory) {
        const newInventory = new Inventory({
          product: item.product_id,
          current_stock: 0,
          warehouse_stock: 0,
          allocated_stock: item.quantity,
          minimum_threshold: product.min_stock_level || 10,
          reorder_quantity: product.min_stock_level * 2 || 20,
          last_updated: new Date(),
        });

        await newInventory.save({ session });
      } else {
        inventory.warehouse_stock -= item.quantity;
        inventory.allocated_stock += item.quantity;
        inventory.last_updated = new Date();

        await inventory.save({ session });
      }

      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: item.product_id,
        transaction_date: new Date(),
        quantity: item.quantity,
        transaction_type: "transfer_out",
        source_type: "warehouse",
        destination_type: "salesman",
        destination_id: salesman_id,
        created_by: req.user.id,
        notes: `Distribution to salesman ${salesman.fullName}, Reference: ${reference_number}`,
      });

      await transaction.save({ session });

      // Update or create salesman inventory
      const salesmanInventory = await SalesmanInventory.findOne({
        salesman: salesman_id,
        product: item.product_id,
      });

      if (!salesmanInventory) {
        // Create new salesman inventory record
        const newSalesmanInventory = new SalesmanInventory({
          salesman: salesman_id,
          product: item.product_id,
          allocated_quantity: item.quantity,
          remaining_quantity: item.quantity,
          distribution_date: new Date(),
        });

        await newSalesmanInventory.save({ session });
      } else {
        // Update existing salesman inventory
        salesmanInventory.allocated_quantity += item.quantity;
        salesmanInventory.remaining_quantity += item.quantity;
        salesmanInventory.last_updated = new Date();

        await salesmanInventory.save({ session });
      }
    }

    await session.commitTransaction();

    // Fetch complete distribution with items
    const completeDistribution = await Distribution.findById(distribution._id);
    const distributionWithItems = {
      ...completeDistribution.toObject(),
      items: distributionItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { distribution: distributionWithItems },
      "Distribution created successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Create wholesale distribution - accessible to warehouse manager only
const createWholesaleDistribution = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipient_name, recipient_contact, items, payment_method, notes } =
      req.body;

    // Validate required fields
    if (
      !recipient_name ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return ApiResponse.error(
        res,
        "Recipient name and items are required",
        400
      );
    }

    // Validate items and check inventory
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return ApiResponse.error(
          res,
          "Product ID and quantity are required for each item",
          400
        );
      }

      // Check if product exists
      const product = await Product.findById(item.product_id);
      if (!product) {
        return ApiResponse.error(
          res,
          `Product with ID ${item.product_id} not found`,
          400
        );
      }

      // Check if there is enough inventory
      const inventory = await Inventory.findOne({ product: item.product_id });
      if (!inventory || inventory.warehouse_stock < item.quantity) {
        return ApiResponse.error(
          res,
          `Not enough stock for product ${product.product_name}. Available: ${
            inventory?.warehouse_stock || 0
          }`,
          400
        );
      }
    }

    // Generate reference number
    const reference_number = `WHSL-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create distribution record
    const distribution = new Distribution({
      distribution_type: "wholesale",
      distribution_date: new Date(),
      recipient_name,
      recipient_contact,
      reference_number,
      status: "completed",
      payment_method: payment_method || "cash",
      notes,
      created_by: req.user.id,
    });

    await distribution.save({ session });

    // Process each item
    const distributionItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // Use custom price if provided, otherwise use product's wholesale price
      const unitPrice = item.unit_price || product.wholesale_price;
      const totalPrice = unitPrice * item.quantity;

      // Create distribution item
      const distributionItem = new DistributionItem({
        distribution: distribution._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });

      await distributionItem.save({ session });
      distributionItems.push(distributionItem);
      totalAmount += totalPrice;

      // Update inventory (decrease warehouse stock and current stock)
      const inventory = await Inventory.findOne({ product: item.product_id });

      // If no inventory record exists, create one (shouldn't happen if validation passed)
      if (!inventory) {
        const newInventory = new Inventory({
          product: item.product_id,
          current_stock: -item.quantity, // Negative because it's been sold
          warehouse_stock: 0,
          allocated_stock: 0,
          minimum_threshold: product.min_stock_level || 10,
          reorder_quantity: product.min_stock_level * 2 || 20,
          last_updated: new Date(),
        });

        await newInventory.save({ session });
      } else {
        inventory.warehouse_stock -= item.quantity;
        inventory.current_stock -= item.quantity;
        inventory.last_updated = new Date();

        await inventory.save({ session });
      }

      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: item.product_id,
        transaction_date: new Date(),
        quantity: item.quantity,
        transaction_type: "stock_out",
        source_type: "warehouse",
        destination_type: "wholesale_customer",
        created_by: req.user.id,
        notes: `Wholesale sale to ${recipient_name}, Reference: ${reference_number}`,
      });

      await transaction.save({ session });
    }

    // Update distribution with total amount
    distribution.total_amount = totalAmount;
    await distribution.save({ session });

    await session.commitTransaction();

    // Fetch complete distribution with items
    const completeDistribution = await Distribution.findById(distribution._id);
    const distributionWithItems = {
      ...completeDistribution.toObject(),
      items: distributionItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { distribution: distributionWithItems },
      "Wholesale distribution created successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Create retail distribution - accessible to warehouse manager only
const createRetailDistribution = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer_name, customer_contact, items, payment_method, notes } =
      req.body;

    // Validate items and check inventory
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.error(res, "Items are required", 400);
    }

    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return ApiResponse.error(
          res,
          "Product ID and quantity are required for each item",
          400
        );
      }

      // Check if product exists
      const product = await Product.findById(item.product_id);
      if (!product) {
        return ApiResponse.error(
          res,
          `Product with ID ${item.product_id} not found`,
          400
        );
      }

      // Check if there is enough inventory
      const inventory = await Inventory.findOne({ product: item.product_id });
      if (!inventory || inventory.warehouse_stock < item.quantity) {
        return ApiResponse.error(
          res,
          `Not enough stock for product ${product.product_name}. Available: ${
            inventory?.warehouse_stock || 0
          }`,
          400
        );
      }
    }

    // Generate reference number
    const reference_number = `RTL-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create distribution record
    const distribution = new Distribution({
      distribution_type: "retail",
      distribution_date: new Date(),
      recipient_name: customer_name || "Walk-in Customer",
      recipient_contact: customer_contact,
      reference_number,
      status: "completed",
      payment_method: payment_method || "cash",
      notes,
      created_by: req.user.id,
    });

    await distribution.save({ session });

    // Process each item
    const distributionItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // Use custom price if provided, otherwise use product's retail price
      const unitPrice = item.unit_price || product.retail_price;
      const totalPrice = unitPrice * item.quantity;

      // Create distribution item
      const distributionItem = new DistributionItem({
        distribution: distribution._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      });

      await distributionItem.save({ session });
      distributionItems.push(distributionItem);
      totalAmount += totalPrice;

      // Update inventory (decrease warehouse stock and current stock)
      const inventory = await Inventory.findOne({ product: item.product_id });

      // If no inventory record exists, create one
      if (!inventory) {
        const newInventory = new Inventory({
          product: item.product_id,
          current_stock: -item.quantity, // Negative because it's been sold
          warehouse_stock: 0,
          allocated_stock: 0,
          minimum_threshold: product.min_stock_level || 10,
          reorder_quantity: product.min_stock_level * 2 || 20,
          last_updated: new Date(),
        });

        await newInventory.save({ session });
      } else {
        inventory.warehouse_stock -= item.quantity;
        inventory.current_stock -= item.quantity;
        inventory.last_updated = new Date();

        await inventory.save({ session });
      }

      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: item.product_id,
        transaction_date: new Date(),
        quantity: item.quantity,
        transaction_type: "stock_out",
        source_type: "warehouse",
        destination_type: "retail_customer",
        created_by: req.user.id,
        notes: `Retail sale${
          customer_name ? " to " + customer_name : ""
        }, Reference: ${reference_number}`,
      });

      await transaction.save({ session });
    }

    // Update distribution with total amount
    distribution.total_amount = totalAmount;
    await distribution.save({ session });

    await session.commitTransaction();

    // Fetch complete distribution with items
    const completeDistribution = await Distribution.findById(distribution._id);
    const distributionWithItems = {
      ...completeDistribution.toObject(),
      items: distributionItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { distribution: distributionWithItems },
      "Retail distribution created successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get salesman's distributions - accessible to the salesman and warehouse manager
const getSalesmanDistributions = async (req, res, next) => {
  try {
    const { salesmanId } = req.params;
    const { startDate, endDate, status, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate salesmanId
    if (!mongoose.Types.ObjectId.isValid(salesmanId)) {
      return ApiResponse.error(res, "Invalid salesman ID", 400);
    }

    // Check if user is authorized to view this salesman's distributions
    // Owner and warehouse manager can view any salesman's distributions
    // Salesman can only view their own distributions
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      salesmanId !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this salesman's distributions"
      );
    }

    // Check if salesman exists
    const salesman = await User.findOne({
      _id: salesmanId,
      role: "salesman",
    });

    if (!salesman) {
      return ApiResponse.notFound(res, "Salesman not found");
    }

    // Build query for distributions
    const query = {
      distribution_type: "salesman",
      recipient: salesmanId,
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.distribution_date = {};

      if (startDate) {
        query.distribution_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.distribution_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await Distribution.countDocuments(query);

    // Execute query with pagination
    const distributions = await Distribution.find(query)
      .sort({ distribution_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get distribution items and value for each distribution
    const distributionsWithDetails = await Promise.all(
      distributions.map(async (dist) => {
        const items = await DistributionItem.find({
          distribution: dist._id,
        }).populate("product", "product_name product_code");

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = items.reduce(
          (sum, item) => sum + item.total_price,
          0
        );

        return {
          ...dist.toObject(),
          items_count: totalItems,
          total_value: totalValue,
        };
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      distributions: distributionsWithDetails,
      salesman: {
        id: salesman._id,
        fullName: salesman.fullName,
        username: salesman.username,
      },
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

// Get current salesman's distributions - accessible to the logged in salesman
const getCurrentSalesmanDistributions = async (req, res, next) => {
  try {
    // Make sure the user is a salesman
    if (req.user.role !== "salesman") {
      return ApiResponse.forbidden(
        res,
        "Only salesmen can access this resource"
      );
    }

    // Call getSalesmanDistributions with the current user's ID
    req.params.salesmanId = req.user.id;
    return getSalesmanDistributions(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Get distribution history - accessible to owner and warehouse manager
const getDistributionHistory = async (req, res, next) => {
  try {
    // Get distribution stats by type and date
    const distributionStats = await Distribution.aggregate([
      // Group by date and type
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$distribution_date",
              },
            },
            type: "$distribution_type",
          },
          count: { $sum: 1 },
          total_value: { $sum: "$total_amount" },
        },
      },
      // Sort by date
      {
        $sort: { "_id.date": -1 },
      },
      // Group by date
      {
        $group: {
          _id: "$_id.date",
          types: {
            $push: {
              type: "$_id.type",
              count: "$count",
              value: "$total_value",
            },
          },
          total_count: { $sum: "$count" },
          total_value: { $sum: "$total_value" },
        },
      },
      // Sort by date
      {
        $sort: { _id: -1 },
      },
      // Limit to last 30 days
      {
        $limit: 30,
      },
    ]);

    // Get top products by distribution quantity
    const topProducts = await DistributionItem.aggregate([
      // Join with products
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Unwind product details
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Group by product
      {
        $group: {
          _id: "$product",
          product_name: { $first: "$productDetails.product_name" },
          product_code: { $first: "$productDetails.product_code" },
          total_quantity: { $sum: "$quantity" },
          total_value: { $sum: "$total_price" },
        },
      },
      // Sort by total quantity
      {
        $sort: { total_quantity: -1 },
      },
      // Limit to top 5
      {
        $limit: 5,
      },
    ]);

    // Get top salesmen by distribution value
    const topSalesmen = await Distribution.aggregate([
      // Filter for salesman distributions
      {
        $match: { distribution_type: "salesman" },
      },
      // Join with users to get salesman details
      {
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          as: "salesmanDetails",
        },
      },
      // Unwind salesman details
      {
        $unwind: {
          path: "$salesmanDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Join with distribution items to get total value
      {
        $lookup: {
          from: "distributionitems",
          localField: "_id",
          foreignField: "distribution",
          as: "items",
        },
      },
      // Add computed fields
      {
        $addFields: {
          total_value: { $sum: "$items.total_price" },
        },
      },
      // Group by salesman
      {
        $group: {
          _id: "$recipient",
          salesman_name: { $first: "$salesmanDetails.fullName" },
          salesman_username: { $first: "$salesmanDetails.username" },
          distribution_count: { $sum: 1 },
          total_value: { $sum: "$total_value" },
        },
      },
      // Sort by total value
      {
        $sort: { total_value: -1 },
      },
      // Limit to top 5
      {
        $limit: 5,
      },
    ]);

    return ApiResponse.success(res, {
      distribution_history: distributionStats,
      top_products: topProducts,
      top_salesmen: topSalesmen,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDistributions,
  getDistributionById,
  createSalesmanDistribution,
  createWholesaleDistribution,
  createRetailDistribution,
  getSalesmanDistributions,
  getCurrentSalesmanDistributions,
  getDistributionHistory,
};
