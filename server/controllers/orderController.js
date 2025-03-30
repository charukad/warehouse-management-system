// server/controllers/orderController.js
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Shop = require("../models/Shop");
const SalesmanInventory = require("../models/SalesmanInventory");
const RestockingSchedule = require("../models/RestockSchedule");
const User = require("../models/User");
const Product = require("../models/Product");
const ApiResponse = require("../utils/apiResponse");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// Get all orders - accessible to owner and warehouse manager
const getAllOrders = async (req, res, next) => {
  try {
    // Optional query parameters
    const {
      status,
      startDate,
      endDate,
      search,
      sortBy = "order_date",
      sortOrder = "desc",
      limit = 10,
      page = 1,
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query object
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.order_date = {};

      if (startDate) {
        query.order_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.order_date.$lte = endDateTime;
      }
    }

    // Use aggregation for more complex queries
    const aggregationPipeline = [
      // Match stage (apply our query)
      { $match: query },

      // Lookup shop details
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

      // Lookup order items
      {
        $lookup: {
          from: "orderitems",
          localField: "_id",
          foreignField: "order",
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
            { reference_number: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add computed fields
    aggregationPipeline.push({
      $addFields: {
        shop_name: "$shopDetails.shop_name",
        salesman_name: "$salesmanDetails.fullName",
        item_count: { $size: "$items" },
      },
    });

    // Add sorting
    // server/controllers/orderController.js (continued)
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
    const result = await Order.aggregate([
      ...aggregationPipeline,
      ...facetPipeline,
    ]);

    // Extract results and metadata
    const orders = result[0].data;
    const metadata = result[0].metadata[0] || { total: 0 };

    // Calculate pagination data
    const total = metadata.total;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      orders,
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

// Get order by ID - accessible to owner, warehouse manager, shop that placed order, and salesman who processed it
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid order ID", 400);
    }

    // Find order by ID
    const order = await Order.findById(id);

    if (!order) {
      return ApiResponse.notFound(res, "Order not found");
    }

    // Check if user is authorized to view this order
    // Owner and warehouse manager can view any order
    // Shop can only view its own orders
    // Salesman can only view orders they processed
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "shop" &&
      order.shop.toString() !== req.user.id &&
      req.user.role === "salesman" &&
      order.salesman.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this order"
      );
    }

    // Get order items
    const items = await OrderItem.find({ order: id }).populate(
      "product",
      "product_name product_code retail_price wholesale_price image_url"
    );

    // Get shop details
    const shop = await Shop.findById(order.shop).select(
      "shop_name address contact_person phone_number"
    );

    // Get salesman details
    const salesman = await User.findById(order.salesman).select(
      "fullName username"
    );

    return ApiResponse.success(res, {
      order,
      items,
      shop,
      salesman,
    });
  } catch (error) {
    next(error);
  }
};

// Create order - accessible to salesman and shop
const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      shop_id,
      items,
      payment_method = "cash",
      notes,
      delivery_date,
      next_restock_date,
    } = req.body;

    // Validate required fields
    if (!shop_id || !items || !Array.isArray(items) || items.length === 0) {
      return ApiResponse.error(res, "Shop ID and items are required", 400);
    }

    // Make sure the user is either a salesman or a shop
    if (req.user.role !== "salesman" && req.user.role !== "shop") {
      return ApiResponse.forbidden(
        res,
        "Only salesmen or shops can create orders"
      );
    }

    // Check if shop exists
    const shop = await Shop.findOne({
      _id: shop_id,
      isActive: true,
    });

    if (!shop) {
      return ApiResponse.notFound(res, "Shop not found or inactive");
    }

    // If user is a shop, make sure they're ordering for themselves
    if (
      req.user.role === "shop" &&
      shop.user &&
      shop.user.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You can only place orders for your own shop"
      );
    }

    // Determine salesman
    let salesmanId;

    if (req.user.role === "salesman") {
      // If user is a salesman, they're creating the order
      salesmanId = req.user.id;
    } else {
      // If user is a shop, use the salesman assigned to the shop
      salesmanId = shop.created_by_salesman;
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

      // If user is a salesman, check if they have enough inventory
      if (req.user.role === "salesman") {
        const salesmanInventory = await SalesmanInventory.findOne({
          salesman: req.user.id,
          product: item.product_id,
        });

        if (
          !salesmanInventory ||
          salesmanInventory.remaining_quantity < item.quantity
        ) {
          return ApiResponse.error(
            res,
            `Not enough stock for product ${product.product_name}. Available: ${
              salesmanInventory?.remaining_quantity || 0
            }`,
            400
          );
        }
      }
    }

    // Generate reference number
    const reference_number = `ORD-${Date.now()
      .toString()
      .slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    // Create order record
    const order = new Order({
      shop: shop_id,
      salesman: salesmanId,
      order_date: new Date(),
      delivery_date: delivery_date ? new Date(delivery_date) : new Date(),
      reference_number,
      status: req.user.role === "salesman" ? "completed" : "pending",
      payment_method,
      notes,
      created_by: req.user.id,
    });

    await order.save({ session });

    // Process each item
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      // Use custom price if provided, otherwise use product's retail price
      const unitPrice = item.unit_price || product.retail_price;
      const totalPrice = unitPrice * item.quantity;

      // Create order item
      const orderItem = new OrderItem({
        order: order._id,
        product: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: totalPrice,
      });

      await orderItem.save({ session });
      orderItems.push(orderItem);
      totalAmount += totalPrice;

      // If the user is a salesman, update their inventory
      if (req.user.role === "salesman") {
        const salesmanInventory = await SalesmanInventory.findOne({
          salesman: req.user.id,
          product: item.product_id,
        });

        if (salesmanInventory) {
          salesmanInventory.remaining_quantity -= item.quantity;
          salesmanInventory.sold_quantity += item.quantity;
          salesmanInventory.last_updated = new Date();

          await salesmanInventory.save({ session });
        }
      }
    }

    // Update order with total amount
    order.total_amount = totalAmount;
    await order.save({ session });

    // If next_restock_date is provided, update shop's restocking schedule
    if (next_restock_date) {
      await RestockingSchedule.findOneAndUpdate(
        { shop: shop_id, isActive: true },
        {
          $set: {
            next_restock_date: new Date(next_restock_date),
            updated_at: new Date(),
            salesman: salesmanId,
          },
        },
        { new: true, upsert: true, session }
      );
    }

    // Update shop's last order date
    shop.last_order_date = new Date();
    await shop.save({ session });

    await session.commitTransaction();

    // Fetch complete order with items
    const completeOrder = await Order.findById(order._id);
    const orderWithItems = {
      ...completeOrder.toObject(),
      items: orderItems.map((item) => item.toObject()),
    };

    return ApiResponse.success(
      res,
      { order: orderWithItems },
      "Order created successfully",
      201
    );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Update order status - accessible to salesman who processed the order
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiResponse.error(res, "Invalid order ID", 400);
    }

    // Validate status
    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return ApiResponse.error(
        res,
        "Invalid status. Must be one of: " + validStatuses.join(", "),
        400
      );
    }

    // Find order by ID
    const order = await Order.findById(id);

    if (!order) {
      return ApiResponse.notFound(res, "Order not found");
    }

    // Check if user is authorized to update this order
    // Only the salesman who processed the order can update it
    // Unless the user is a warehouse manager or owner
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      order.salesman.toString() !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to update this order"
      );
    }

    // Special handling for cancelled orders
    if (status === "cancelled" && order.status === "completed") {
      return ApiResponse.error(res, "Cannot cancel a completed order", 400);
    }

    // If moving from pending to completed and user is a salesman,
    // make sure the salesman has enough inventory
    if (
      status === "completed" &&
      order.status === "pending" &&
      req.user.role === "salesman"
    ) {
      // Get order items
      const orderItems = await OrderItem.find({ order: id });

      // Check salesman inventory for each item
      for (const item of orderItems) {
        const salesmanInventory = await SalesmanInventory.findOne({
          salesman: req.user.id,
          product: item.product,
        });

        if (
          !salesmanInventory ||
          salesmanInventory.remaining_quantity < item.quantity
        ) {
          const product = await Product.findById(item.product);
          return ApiResponse.error(
            res,
            `Not enough stock for product ${
              product?.product_name || item.product
            }. Available: ${salesmanInventory?.remaining_quantity || 0}`,
            400
          );
        }
      }

      // Update salesman inventory
      for (const item of orderItems) {
        const salesmanInventory = await SalesmanInventory.findOne({
          salesman: req.user.id,
          product: item.product,
        });

        salesmanInventory.remaining_quantity -= item.quantity;
        salesmanInventory.sold_quantity += item.quantity;
        salesmanInventory.last_updated = new Date();

        await salesmanInventory.save();
      }
    }

    // Update order status
    order.status = status;

    // Add notes if provided
    if (notes) {
      order.notes = order.notes
        ? `${order.notes}\n\n${new Date().toISOString()}: ${notes}`
        : `${new Date().toISOString()}: ${notes}`;
    }

    await order.save();

    return ApiResponse.success(
      res,
      { order },
      "Order status updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get orders by shop - accessible to owner, warehouse manager, shop itself, and assigned salesman
const getOrdersByShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const { status, startDate, endDate, limit = 10, page = 1 } = req.query;
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

    // Check if user is authorized to view this shop's orders
    // Owner and warehouse manager can view any shop's orders
    // Shop can only view its own orders
    // Salesman can only view orders for shops they manage
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
        "You are not authorized to view this shop's orders"
      );
    }

    // Build query
    const query = { shop: shopId };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.order_date = {};

      if (startDate) {
        query.order_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.order_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort({ order_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("salesman", "fullName username");

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order: order._id }).populate(
          "product",
          "product_name product_code"
        );

        return {
          ...order.toObject(),
          items,
          item_count: items.length,
        };
      })
    );

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      orders: ordersWithItems,
      shop: {
        id: shop._id,
        name: shop.shop_name,
        address: shop.address,
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

// Get orders by salesman - accessible to owner, warehouse manager, and the salesman
const getOrdersBySalesman = async (req, res, next) => {
  try {
    const { salesmanId } = req.params;
    const { status, startDate, endDate, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Validate salesmanId
    if (!mongoose.Types.ObjectId.isValid(salesmanId)) {
      return ApiResponse.error(res, "Invalid salesman ID", 400);
    }

    // Check if user is authorized to view this salesman's orders
    // Owner and warehouse manager can view any salesman's orders
    // Salesman can only view their own orders
    if (
      req.user.role !== "owner" &&
      req.user.role !== "warehouse_manager" &&
      req.user.role === "salesman" &&
      salesmanId !== req.user.id
    ) {
      return ApiResponse.forbidden(
        res,
        "You are not authorized to view this salesman's orders"
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

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.order_date = {};

      if (startDate) {
        query.order_date.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set the end date to the end of the day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.order_date.$lte = endDateTime;
      }
    }

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort({ order_date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("shop", "shop_name address");

    // Calculate order statistics
    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0
    );
    const completedCount = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const pendingCount = orders.filter(
      (order) => order.status === "pending"
    ).length;

    // Calculate pagination data
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return ApiResponse.success(res, {
      orders,
      salesman: {
        id: salesman._id,
        fullName: salesman.fullName,
        username: salesman.username,
      },
      stats: {
        total_orders: orders.length,
        total_amount: totalAmount,
        completed: completedCount,
        pending: pendingCount,
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

// Get current shop's orders - accessible to the logged in shop
const getCurrentShopOrders = async (req, res, next) => {
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

    // Call getOrdersByShop with the shop's ID
    req.params.shopId = shop._id.toString();
    return getOrdersByShop(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Get current salesman's processed orders - accessible to the logged in salesman
const getCurrentSalesmanOrders = async (req, res, next) => {
  try {
    // Make sure the user is a salesman
    if (req.user.role !== "salesman") {
      return ApiResponse.forbidden(
        res,
        "Only salesmen can access this resource"
      );
    }

    // Call getOrdersBySalesman with the current user's ID
    req.params.salesmanId = req.user.id;
    return getOrdersBySalesman(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrdersByShop,
  getOrdersBySalesman,
  getCurrentShopOrders,
  getCurrentSalesmanOrders,
};
