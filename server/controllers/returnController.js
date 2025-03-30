// server/controllers/returnController.js
const Return = require("../models/Return");
const ReturnItem = require("../models/ReturnItem");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const SalesmanInventory = require("../models/SalesmanInventory");
const Inventory = require("../models/Inventory");
const InventoryTransaction = require("../models/InventoryTransaction");
const User = require("../models/User");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all returns - accessible to owner and warehouse manager
const getAllReturns = async (req, res, next) => {
  try {
    // Optional query parameters
    const {
      type,
      startDate,
      endDate,
      status,
      search,
      sortBy = "return_date",
      sortOrder = "desc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by return type if provided
    if (type) {
      query.return_type = type;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.return_date = {};

      if (startDate) {
        query.return_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.return_date.$lte = endDateTime;
      }
    }

    // Use aggregation for more complex queries
    const aggregationPipeline = [
      // Match stage (apply our query)
      { $match: query },

      // Lookup shop details if shop return
      {
        $lookup: {
          from: "shops",
          localField: "shop",
          foreignField: "_id",
          as: "shopDetails",
        },
      },

      // Unwind shop details
      {
        $unwind: {
          path: "$shopDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup salesman details
      {
        $lookup: {
          from: "users",
          localField: "salesman",
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

      // Lookup processor details
      {
        $lookup: {
          from: "users",
          localField: "processed_by",
          foreignField: "_id",
          as: "processorDetails",
        },
      },

      // Unwind processor details
      {
        $unwind: {
          path: "$processorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Lookup return items
      {
        $lookup: {
          from: "returnitems",
          localField: "_id",
          foreignField: "return",
          as: "items",
        },
      },
    ];

    // Add search filter if provided
    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { "shopDetails.shop_name": { $regex: search, $options: "i" } },
            { "salesmanDetails.fullName": { $regex: search, $options: "i" } },
            { "processorDetails.fullName": { $regex: search, $options: "i" } },
            { reference_number: { $regex: search, $options: "i" } },
            { return_reason: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add computed fields
    aggregationPipeline.push({
      $addFields: {
        shop_name: "$shopDetails.shop_name",
        salesman_name: "$salesmanDetails.fullName",
        processor_name: "$processorDetails.fullName",
        item_count: { $size: "$items" },
      },
    });

    // Add sorting
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    aggregationPipeline.push({
      $sort: { [sortBy]: sortDirection },
    });

    // Add facet for pagination
    const facetPipeline = [
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ];

    // Execute the aggregation
    const result = await Return.aggregate([
      ...aggregationPipeline,
      ...facetPipeline,
    ]);

    // Extract results and metadata
    const returns = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0 };

    // Calculate pagination data
    const total = metadata.total;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      returns,
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

// Get return by ID - accessible to owner, warehouse manager, shop that placed return, and salesman who processed it
const getReturnById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid return ID", 400);
    }

    // Find return by ID
    const returnRecord = await Return.findById(id);

    if (!returnRecord) {
      return ApiResponse.notFound(res, "Return not found");
    }

    // Check if user is authorized to view this return
    // Owner and warehouse manager can view any return
    // Shop can only view its own returns
    // Salesman can only view returns they processed or that are from their shops
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "shop" &&
      returnRecord.shop &&
      returnRecord.shop.toString() !== req.user.id &&
      req.user.role === "salesman" &&
      returnRecord.salesman.toString() !== req.user.id &&
      returnRecord.processed_by.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this return"
      );
    }

    // Get return items
    const items = await ReturnItem.find({ return: id }).populate(
      "product",
      "product_name product_code retail_price wholesale_price image_url"
    );

    // Get related entities based on return type
    let shop = null;
    let salesman = null;
    let order = null;
    let processor = null;

    if (returnRecord.shop) {
      shop = await Shop.findById(returnRecord.shop).select(
        "shop_name address contact_person phone_number"
      );
    }

    if (returnRecord.salesman) {
      salesman = await User.findById(returnRecord.salesman).select(
        "fullName username"
      );
    }

    if (returnRecord.order) {
      order = await Order.findById(returnRecord.order).select(
        "reference_number order_date total_amount"
      );
    }

    if (returnRecord.processed_by) {
      processor = await User.findById(returnRecord.processed_by).select(
        "fullName username role"
      );
    }

    return ApiResponse.success(res, {
      return: returnRecord,
      items,
      shop,
      salesman,
      order,
      processor,
    });
  } catch (error) {
    next(error);
  }
};

// Create shop return - accessible to salesman only
const createShopReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Make sure the user is a salesman
    if (req.user.role !== "salesman") {
      return ApiResponse.forbidden(
        res,
        "Only salesmen can process shop returns"
      );
    }

    const { shop_id, items, return_reason, order_id, notes } = req.body;

    // Validate required fields
    if (!shop_id || !items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.error(res, "Shop ID and items are required", 400);
    }

    // Check if shop exists
    const shop = await Shop.findOne({
      _id: shop_id,
      isActive: true,
    });

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found or inactive");
    }

    // Check if this salesman is assigned to this shop
    if (shop.created_by_salesman.toString() !== req.user.id) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to process returns for this shop"
      );
    }

    // Check order if provided
    let order = null;
    if (order_id) {
      if (!mongoose.Types.ObjectId.isValid(order_id)) {
        return ApiResponse.error(res, "Invalid order ID", 400);
      }

      order = await Order.findById(order_id);
      if (!order) {
        return ApiResponse.notFound(res, "Order not found");
      }

      // Check if order belongs to this shop and salesman
      if (
        order.shop.toString() !== shop_id ||
        order.salesman.toString() !== req.user.id
      ) {
        return ApiResponse.forbidden(
          res,
          "Order does not belong to this shop or salesman"
        );
      }
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.condition) {
        return ApiResponse.error(
          res,
          "Product ID, quantity, and condition are required for each item",
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
    }

    // Generate reference number
    const reference_number = `RET-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create return record
    const returnRecord = new Return({
      return_type: "shop",
      shop: shop_id,
      salesman: req.user.id,
      order: order_id,
      return_date: new Date(),
      reference_number,
      return_reason: return_reason || "No specific reason provided",
      status: "processed",
      processed_by: req.user.id,
      notes,
    });

    await returnRecord.save({ session });

    // Process each item
    const returnItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // Determine unit price - for shop return, we typically use the retail price
      const unitPrice = item.unit_price || product.retail_price;
      const lineTotal = unitPrice * item.quantity;

      // Create return item
      const returnItem = new ReturnItem({
        return: returnRecord._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        condition: item.condition,
        notes: item.notes,
      });

      await returnItem.save({ session });
      returnItems.push(returnItem);
      totalAmount += lineTotal;

      // Update salesman inventory - add to salesman's inventory
      const salesmanInventory = await SalesmanInventory.findOne({
        salesman: req.user.id,
        product: item.product_id,
      });

      if (!salesmanInventory) {
        // Create new inventory record if it doesn't exist
        const newSalesmanInventory = new SalesmanInventory({
          salesman: req.user.id,
          product: item.product_id,
          allocated_quantity: 0,
          remaining_quantity: item.quantity,
          returned_quantity: 0,
          distribution_date: new Date(),
          last_updated: new Date(),
        });

        await newSalesmanInventory.save({ session });
      } else {
        // Update existing inventory
        salesmanInventory.remaining_quantity += item.quantity;
        salesmanInventory.last_updated = new Date();

        await salesmanInventory.save({ session });
      }

      // If item is damaged or expired, we might not add it back to main inventory
      if (item.condition === "good") {
        // Item can be added back to inventory in a future process
        // We don't do it here because the salesman takes it back first
      }
    }

    // Update return with total amount
    returnRecord.total_amount = totalAmount;
    await returnRecord.save({ session });

    await session.commitTransaction();

    // Fetch complete return with items
    const completeReturn = await Return.findById(returnRecord._id);
    const returnWithItems = {
      ...completeReturn.toObject(),
      items: returnItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { return: returnWithItems },
      "Shop return processed successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Create end-of-day salesman return - accessible to warehouse manager only
const createSalesmanReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Make sure the user is a warehouse manager
    if (req.user.role !== "warehouse_manager") {
      return ApiResponse.forbidden(
        res,
        "Only warehouse managers can process salesman returns"
      );
    }

    const { salesman_id, items, notes } = req.body;

    // Validate required fields
    if (!salesman_id || !items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.error(res, "Salesman ID and items are required", 400);
    }

    // Check if salesman exists
    const salesman = await User.findOne({
      _id: salesman_id,
      role: "salesman",
      isActive: true,
    });

    if (!salesman) {
      return ApiResponse.notFound(res, "Salesman not found or inactive");
    }

    // Validate items
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

      // Check if salesman has enough inventory
      const salesmanInventory = await SalesmanInventory.findOne({
        salesman: salesman_id,
        product: item.product_id,
      });

      if (
        !salesmanInventory ||
        salesmanInventory.remaining_quantity < item.quantity
      ) {
        return ApiResponse.error(
          res,
          `Salesman does not have enough ${product.product_name}. Available: ${
            salesmanInventory?.remaining_quantity || 0
          }`,
          400
        );
      }
    }

    // Generate reference number
    const reference_number = `EOD-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create return record
    const returnRecord = new Return({
      return_type: "salesman",
      salesman: salesman_id,
      return_date: new Date(),
      reference_number,
      return_reason: "End of day return",
      status: "processed",
      processed_by: req.user.id,
      notes,
    });

    await returnRecord.save({ session });

    // Process each item
    const returnItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // For salesman returns, we typically use wholesale price
      const unitPrice = product.wholesale_price;
      const lineTotal = unitPrice * item.quantity;

      // Create return item
      const returnItem = new ReturnItem({
        return: returnRecord._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        condition: "good", // End of day returns are typically good condition
        notes: item.notes,
      });

      await returnItem.save({ session });
      returnItems.push(returnItem);
      totalAmount += lineTotal;

      // Update salesman inventory - decrease remaining quantity
      const salesmanInventory = await SalesmanInventory.findOne({
        salesman: salesman_id,
        product: item.product_id,
      });

      salesmanInventory.remaining_quantity -= item.quantity;
      salesmanInventory.returned_quantity += item.quantity;
      salesmanInventory.last_updated = new Date();

      await salesmanInventory.save({ session });

      // Update warehouse inventory - add back to warehouse stock
      const inventory = await Inventory.findOne({ product: item.product_id });

      if (!inventory) {
        // Create new inventory record if it doesn't exist
        const newInventory = new Inventory({
          product: item.product_id,
          current_stock: item.quantity,
          warehouse_stock: item.quantity,
          allocated_stock: 0,
          minimum_threshold: product.min_stock_level || 10,
          reorder_quantity: product.min_stock_level * 2 || 20,
          last_updated: new Date(),
        });

        await newInventory.save({ session });
      } else {
        // Update existing inventory
        inventory.warehouse_stock += item.quantity;
        inventory.allocated_stock = Math.max(
          0,
          inventory.allocated_stock - item.quantity
        );
        inventory.last_updated = new Date();

        await inventory.save({ session });
      }

      // Create inventory transaction
      const transaction = new InventoryTransaction({
        product: item.product_id,
        transaction_date: new Date(),
        quantity: item.quantity,
        transaction_type: "transfer_in",
        source_type: "salesman",
        source_id: salesman_id,
        destination_type: "warehouse",
        created_by: req.user.id,
        notes: `End of day return from salesman ${salesman.fullName}, Reference: ${reference_number}`,
      });

      await transaction.save({ session });
    }

    // Update return with total amount
    returnRecord.total_amount = totalAmount;
    await returnRecord.save({ session });

    await session.commitTransaction();

    // Fetch complete return with items
    const completeReturn = await Return.findById(returnRecord._id);
    const returnWithItems = {
      ...completeReturn.toObject(),
      items: returnItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { return: returnWithItems },
      "Salesman return processed successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Get returns by shop - accessible to owner, warehouse manager, shop itself, and assigned salesman
const getReturnsByShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate shopId
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return ApiResponse.error(res, "Invalid shop ID", 400);
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found");
    }

    // Check if user is authorized to view this shop's returns
    // Owner and warehouse manager can view any shop's returns
    // Shop can only view its own returns
    // Salesman can only view returns for shops they manage
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "shop" &&
      shop.user &&
      shop.user.toString() !== req.user.id &&
      req.user.role === "salesman" &&
      shop.created_by_salesman.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this shop's returns"
      );
    }

    // Build query
    const query = {
      shop: shopId,
      return_type: "shop",
    };

    // Add date range if provided
    if (startDate || endDate) {
      query.return_date = {};

      if (startDate) {
        query.return_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.return_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await Return.countDocuments(query);

    // Execute query with pagination
    const returns = await Return.find(query)
      .sort({ return_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("salesman", "fullName username")
      .populate("processed_by", "fullName username");

    // Get return items
    const returnsWithItems = await Promise.all(
      returns.map(async (ret) => {
        const items = await ReturnItem.find({ return: ret._id }).populate(
          "product",
          "product_name product_code"
        );

        return {
          ...ret.toObject(),
          items,
          item_count: items.length,
          item_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate return statistics
    const totalAmount = returnsWithItems.reduce(
      (sum, ret) => sum + (ret.total_amount || 0),
      0
    );
    const totalItems = returnsWithItems.reduce(
      (sum, ret) => sum + ret.item_quantity,
      0
    );

    return ApiResponse.success(res, {
      returns: returnsWithItems,
      shop: {
        id: shop._id,
        name: shop.shop_name,
        address: shop.address,
      },
      stats: {
        total_returns: returns.length,
        total_amount: totalAmount,
        total_items: totalItems,
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

// Get returns by salesman - accessible to owner, warehouse manager, and the salesman
const getReturnsBySalesman = async (req, res, next) => {
  try {
    const { salesmanId } = req.params;
    const { type, startDate, endDate, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate salesmanId
    if (!mongoose.Types.ObjectId.isValid(salesmanId)) {
      return ApiResponse.error(res, "Invalid salesman ID", 400);
    }

    // Check if user is authorized to view this salesman's returns
    // Owner and warehouse manager can view any salesman's returns
    // Salesman can only view their own returns
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      salesmanId !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this salesman's returns"
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

    // Build query
    const query = { salesman: salesmanId };

    // Filter by return type if provided
    if (type) {
      query.return_type = type;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.return_date = {};

      if (startDate) {
        query.return_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.return_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await Return.countDocuments(query);

    // Execute query with pagination
    const returns = await Return.find(query)
      .sort({ return_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get additional details for each return
    const returnsWithDetails = await Promise.all(
      returns.map(async (ret) => {
        const items = await ReturnItem.find({ return: ret._id }).populate(
          "product",
          "product_name product_code"
        );

        let shopDetails = null;
        if (ret.shop) {
          shopDetails = await Shop.findById(ret.shop).select(
            "shop_name address"
          );
        }

        return {
          ...ret.toObject(),
          items,
          shop: shopDetails,
          item_count: items.length,
          item_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        };
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate return statistics by type
    const shopReturns = returnsWithDetails.filter(
      (ret) => ret.return_type === "shop"
    );
    const salesmanReturns = returnsWithDetails.filter(
      (ret) => ret.return_type === "salesman"
    );

    const stats = {
      total_returns: returns.length,
      shop_returns: {
        count: shopReturns.length,
        total_amount: shopReturns.reduce(
          (sum, ret) => sum + (ret.total_amount || 0),
          0
        ),
        total_items: shopReturns.reduce(
          (sum, ret) => sum + ret.item_quantity,
          0
        ),
      },
      salesman_returns: {
        count: salesmanReturns.length,
        total_amount: salesmanReturns.reduce(
          (sum, ret) => sum + (ret.total_amount || 0),
          0
        ),
        total_items: salesmanReturns.reduce(
          (sum, ret) => sum + ret.item_quantity,
          0
        ),
      },
    };

    return ApiResponse.success(res, {
      returns: returnsWithDetails,
      salesman: {
        id: salesman._id,
        fullName: salesman.fullName,
        username: salesman.username,
      },
      stats,
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

// Get current shop's returns - accessible to the logged in shop
const getCurrentShopReturns = async (req, res, next) => {
  try {
    // Make sure the user is a shop
    if (req.user.role !== "shop") {
      return ApiResponse.forbidden(res, "Only shops can access this resource");
    }

    // Get shop associated with this user
    const shop = await Shop.findOne({ user: req.user.id });

    if (!shop) {
      return ApiResponse.notFound(res, "No shop found for this user account");
    }

    // Call getReturnsByShop with the shop's ID
    req.params.shopId = shop._id.toString();
    return getReturnsByShop(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Get returns analysis - accessible to owner only
// Get returns analysis - accessible to owner only
const getReturnsAnalysis = async (req, res, next) => {
  try {
    // Make sure the user is an owner
    if (req.user.role !== "owner") {
      return ApiResponse.forbidden(
        res,
        "Only owners can access returns analysis"
      );
    }

    const { startDate, endDate } = req.query;

    // Build date range
    const dateRange = {};

    if (startDate || endDate) {
      if (startDate) {
        dateRange.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateRange.$lte = endDateTime;
      }
    } else {
      // Default to last 30 days if no date range provided
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateRange.$gte = thirtyDaysAgo;
    }

    // Analysis 1: Returns by type over time
    const returnsByType = await Return.aggregate([
      {
        $match: {
          return_date: dateRange,
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$return_date" },
            },
            type: "$return_type",
          },
          count: { $sum: 1 },
          total_amount: { $sum: "$total_amount" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    // Analysis 2: Top products returned
    const topReturnedProducts = await ReturnItem.aggregate([
      {
        $lookup: {
          from: "returns",
          localField: "return",
          foreignField: "_id",
          as: "returnInfo",
        },
      },
      {
        $unwind: "$returnInfo",
      },
      {
        $match: {
          "returnInfo.return_date": dateRange,
        },
      },
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
          _id: "$product",
          product_name: { $first: "$productInfo.product_name" },
          product_code: { $first: "$productInfo.product_code" },
          product_type: { $first: "$productInfo.product_type" },
          total_quantity: { $sum: "$quantity" },
          total_value: { $sum: "$line_total" },
          return_count: { $sum: 1 },
        },
      },
      {
        $sort: { total_quantity: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Analysis 3: Return reasons analysis
    const returnReasons = await Return.aggregate([
      {
        $match: {
          return_date: dateRange,
        },
      },
      {
        $group: {
          _id: "$return_reason",
          count: { $sum: 1 },
          total_amount: { $sum: "$total_amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Analysis 4: Shop return rate
    const shopReturnRate = await Shop.aggregate([
      // Lookup orders
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "shop",
          as: "orders",
        },
      },
      // Lookup returns
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "shop",
          as: "returns",
        },
      },
      // Filter for shops with orders
      {
        $match: {
          "orders.0": { $exists: true },
        },
      },
      // Calculate metrics
      {
        $project: {
          shop_name: 1,
          address: 1,
          order_count: { $size: "$orders" },
          return_count: { $size: "$returns" },
          order_value: { $sum: "$orders.total_amount" },
          return_value: { $sum: "$returns.total_amount" },
          return_rate: {
            $cond: {
              if: { $eq: [{ $size: "$orders" }, 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: [{ $size: "$returns" }, { $size: "$orders" }] },
                  100,
                ],
              },
            },
          },
          value_return_rate: {
            $cond: {
              if: { $eq: [{ $sum: "$orders.total_amount" }, 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      { $sum: "$returns.total_amount" },
                      { $sum: "$orders.total_amount" },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
      // Sort by return rate
      {
        $sort: { return_rate: -1 },
      },
      // Limit to top 10
      {
        $limit: 10,
      },
    ]);

    // Analysis 5: Salesman return rate
    const salesmanReturnRate = await User.aggregate([
      // Filter for salesmen
      {
        $match: {
          role: "salesman",
        },
      },
      // Lookup orders processed by salesman
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "salesman",
          as: "orders",
        },
      },
      // Lookup returns processed by salesman
      {
        $lookup: {
          from: "returns",
          localField: "_id",
          foreignField: "salesman",
          as: "returns",
        },
      },
      // Filter for salesmen with orders
      {
        $match: {
          "orders.0": { $exists: true },
        },
      },
      // Calculate metrics
      {
        $project: {
          fullName: 1,
          username: 1,
          order_count: { $size: "$orders" },
          return_count: { $size: "$returns" },
          order_value: { $sum: "$orders.total_amount" },
          return_value: { $sum: "$returns.total_amount" },
          return_rate: {
            $cond: {
              if: { $eq: [{ $size: "$orders" }, 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: [{ $size: "$returns" }, { $size: "$orders" }] },
                  100,
                ],
              },
            },
          },
          value_return_rate: {
            $cond: {
              if: { $eq: [{ $sum: "$orders.total_amount" }, 0] },
              then: 0,
              else: {
                $multiply: [
                  {
                    $divide: [
                      { $sum: "$returns.total_amount" },
                      { $sum: "$orders.total_amount" },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
      // Sort by return rate
      {
        $sort: { return_rate: -1 },
      },
    ]);

    // Analysis 6: Return condition analysis for product quality
    const returnConditions = await ReturnItem.aggregate([
      {
        $lookup: {
          from: "returns",
          localField: "return",
          foreignField: "_id",
          as: "returnInfo",
        },
      },
      {
        $unwind: "$returnInfo",
      },
      {
        $match: {
          "returnInfo.return_date": dateRange,
          "returnInfo.return_type": "shop", // Only analyze shop returns for product quality
        },
      },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 },
          total_quantity: { $sum: "$quantity" },
          total_value: { $sum: "$line_total" },
        },
      },
      {
        $sort: { total_quantity: -1 },
      },
    ]);

    // Analysis 7: Return impact on net income
    // Calculate total sales in the period
    const totalSales = await Order.aggregate([
      {
        $match: {
          order_date: dateRange,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total_sales: { $sum: "$total_amount" },
          order_count: { $sum: 1 },
        },
      },
    ]);

    // Calculate total returns in the period
    const totalReturns = await Return.aggregate([
      {
        $match: {
          return_date: dateRange,
        },
      },
      {
        $group: {
          _id: null,
          total_returns: { $sum: "$total_amount" },
          return_count: { $sum: 1 },
        },
      },
    ]);

    // Compile analysis results
    const analysis = {
      time_period: {
        start_date: dateRange.$gte,
        end_date: dateRange.$lte || new Date(),
      },
      returns_by_type: returnsByType,
      top_returned_products: topReturnedProducts,
      return_reasons: returnReasons,
      shop_return_rates: shopReturnRate,
      salesman_return_rates: salesmanReturnRate,
      return_conditions: returnConditions,
      financial_impact: {
        total_sales: totalSales.length > 0 ? totalSales[0].total_sales : 0,
        total_returns:
          totalReturns.length > 0 ? totalReturns[0].total_returns : 0,
        return_ratio:
          totalSales.length > 0 && totalSales[0].total_sales > 0
            ? totalReturns.length > 0
              ? (totalReturns[0].total_returns / totalSales[0].total_sales) *
                100
              : 0
            : 0,
        order_count: totalSales.length > 0 ? totalSales[0].order_count : 0,
        return_count:
          totalReturns.length > 0 ? totalReturns[0].return_count : 0,
      },
    };

    return ApiResponse.success(res, { analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReturns,
  getReturnById,
  createShopReturn,
  createSalesmanReturn,
  getReturnsByShop,
  getReturnsBySalesman,
  getCurrentShopReturns,
  getReturnsAnalysis,
};
