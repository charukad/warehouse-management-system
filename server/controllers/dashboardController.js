// server/controllers/dashboardController.js

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Return = require("../models/Return");
const ReturnItem = require("../models/ReturnItem");
const Inventory = require("../models/Inventory");
const Salesman = require("../models/Salesman");
const SalesmanInventory = require("../models/SalesmanInventory");
const {
  success: apiSuccess,
  error: apiError,
} = require("../utils/apiResponse");

/**
 * Dashboard Controller
 * Provides aggregated data for role-specific dashboards
 */
const dashboardController = {
  /**
   * Get dashboard data based on user role
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getDashboardData: async (req, res) => {
    try {
      const { role } = req.user;

      switch (role) {
        case "owner":
          return await dashboardController.getOwnerDashboard(req, res);
        case "warehouse_manager":
          return await dashboardController.getWarehouseDashboard(req, res);
        case "salesman":
          return await dashboardController.getSalesmanDashboard(req, res);
        case "shop":
          return await dashboardController.getShopDashboard(req, res);
        default:
          return apiError(res, "Invalid user role", 400);
      }
    } catch (error) {
      console.error("Dashboard data error:", error);
      return apiError(res, "Error fetching dashboard data", error);
    }
  },

  /**
   * Get owner dashboard data
   * Includes sales summaries, product performance, salesman performance,
   * shop performance, and overall financial metrics
   */
  getOwnerDashboard: async (req, res) => {
    try {
      // Get date range filters from the request
      const { startDate, endDate, period } = req.query;

      // Define date range for queries
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (period) {
        const today = new Date();
        const periodStartDate = new Date();

        switch (period) {
          case "day":
            periodStartDate.setDate(today.getDate() - 1);
            break;
          case "week":
            periodStartDate.setDate(today.getDate() - 7);
            break;
          case "month":
            periodStartDate.setMonth(today.getMonth() - 1);
            break;
          case "year":
            periodStartDate.setFullYear(today.getFullYear() - 1);
            break;
          default:
            periodStartDate.setDate(today.getDate() - 30); // Default to last 30 days
        }

        dateFilter.createdAt = {
          $gte: periodStartDate,
          $lte: today,
        };
      }

      // Get total sales data
      const salesData = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]);

      // Get product performance data
      const productPerformance = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            totalSold: 1,
            totalRevenue: 1,
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]);

      // Get salesman performance data
      const salesmanPerformance = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        {
          $group: {
            _id: "$salesmanId",
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            shopCount: { $addToSet: "$shopId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "salesmanDetails",
          },
        },
        { $unwind: "$salesmanDetails" },
        {
          $project: {
            salesmanId: "$_id",
            salesmanName: "$salesmanDetails.fullName",
            totalSales: 1,
            orderCount: 1,
            shopCount: { $size: "$shopCount" },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get shop performance data
      const shopPerformance = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        {
          $group: {
            _id: "$shopId",
            totalSpent: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            averageOrderValue: { $avg: "$totalAmount" },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "_id",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $project: {
            shopId: "$_id",
            shopName: "$shopDetails.shopName",
            totalSpent: 1,
            orderCount: 1,
            averageOrderValue: 1,
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]);

      // Get return data
      const returnData = await Return.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalReturnAmount: { $sum: "$totalAmount" },
            returnCount: { $sum: 1 },
          },
        },
      ]);

      // Get inventory alerts
      const inventoryAlerts = await Inventory.aggregate([
        { $match: { currentStock: { $lte: "$minimumThreshold" } } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$productDetails._id",
            productName: "$productDetails.productName",
            currentStock: 1,
            minimumThreshold: 1,
            reorderQuantity: 1,
            alertLevel: {
              $cond: {
                if: { $eq: ["$currentStock", 0] },
                then: "critical",
                else: "warning",
              },
            },
          },
        },
      ]);

      // Get sales trends - daily sales for the period
      const salesTrends = await Order.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            dailySales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Assemble and return the complete dashboard data
      const dashboardData = {
        summary:
          salesData.length > 0
            ? salesData[0]
            : { totalSales: 0, orderCount: 0, averageOrderValue: 0 },
        productPerformance,
        salesmanPerformance,
        shopPerformance,
        returns:
          returnData.length > 0
            ? returnData[0]
            : { totalReturnAmount: 0, returnCount: 0 },
        inventoryAlerts,
        salesTrends,
      };

      return apiSuccess(
        res,
        "Dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Owner dashboard error:", error);
      return apiError(res, "Error fetching dashboard data", error);
    }
  },

  /**
   * Get warehouse manager dashboard data
   * Includes inventory status, distribution summary, and return processing data
   */
  getWarehouseDashboard: async (req, res) => {
    try {
      // Get inventory summary
      const inventorySummary = await Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$currentStock" },
            lowStockItems: {
              $sum: {
                $cond: [{ $lte: ["$currentStock", "$minimumThreshold"] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get distribution summary for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const distributionSummary = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalDistributed: { $sum: "$totalAmount" },
            distributionCount: { $sum: 1 },
          },
        },
      ]);

      // Get return processing summary
      const returnsSummary = await Return.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$returnType",
            returnCount: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      // Get most frequently distributed products
      const topDistributedProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            totalQuantity: { $sum: "$items.quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            totalQuantity: 1,
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]);

      // Get products with highest return rates
      const highReturnProducts = await Return.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            returnedQuantity: { $sum: "$items.quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            returnedQuantity: 1,
          },
        },
        { $sort: { returnedQuantity: -1 } },
        { $limit: 10 },
      ]);

      // Assemble and return the warehouse dashboard data
      const dashboardData = {
        inventorySummary:
          inventorySummary.length > 0
            ? inventorySummary[0]
            : { totalProducts: 0, totalStock: 0, lowStockItems: 0 },
        distributionSummary:
          distributionSummary.length > 0
            ? distributionSummary[0]
            : { totalDistributed: 0, distributionCount: 0 },
        returnsSummary,
        topDistributedProducts,
        highReturnProducts,
      };

      return apiSuccess(
        res,
        "Warehouse dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Warehouse dashboard error:", error);
      return apiError(res, "Error fetching warehouse dashboard data", error);
    }
  },

  /**
   * Get salesman dashboard data
   * Includes daily targets, shop information, delivery schedule, and performance metrics
   */
  getSalesmanDashboard: async (req, res) => {
    try {
      // Get user ID from authenticated user
      const salesmanId = req.user._id;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get salesman profile
      const salesmanProfile = await Salesman.findOne({ user: salesmanId });

      if (!salesmanProfile) {
        return apiError(res, "Salesman profile not found", 404);
      }

      // Get salesman's assigned shops
      const assignedShops = await Shop.find({
        createdBySalesman: salesmanProfile._id,
        isActive: true,
      }).select("shopName address phone latitude longitude lastOrderDate");

      // Get today's orders
      const todaysOrders = await Order.aggregate([
        {
          $match: {
            salesman: salesmanProfile._id,
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "shop",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $project: {
            orderId: "$_id",
            shopName: "$shopDetails.shopName",
            orderAmount: "$totalAmount",
            status: 1,
            createdAt: 1,
          },
        },
      ]);

      // Get sales performance for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const salesPerformance = await Order.aggregate([
        {
          $match: {
            salesman: salesmanProfile._id,
            createdAt: { $gte: currentMonth },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            uniqueShops: { $addToSet: "$shop" },
          },
        },
      ]);

      // Get shops that need restocking
      const restockingSchedule = await Shop.aggregate([
        {
          $match: {
            createdBySalesman: salesmanProfile._id,
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "restockschedules",
            localField: "_id",
            foreignField: "shop",
            as: "restockSchedule",
          },
        },
        {
          $unwind: {
            path: "$restockSchedule",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { "restockSchedule.nextRestockDate": { $lte: tomorrow } },
              { restockSchedule: { $exists: false } },
            ],
          },
        },
        {
          $project: {
            shopId: "$_id",
            shopName: 1,
            address: 1,
            latitude: 1,
            longitude: 1,
            nextRestockDate: "$restockSchedule.nextRestockDate",
          },
        },
      ]);

      // Get inventory allocated to salesman
      const inventory = await SalesmanInventory.aggregate([
        { $match: { salesman: salesmanProfile._id } },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$productDetails._id",
            productName: "$productDetails.productName",
            allocatedQuantity: 1,
            soldQuantity: 1,
            returnedQuantity: 1,
            retailPrice: "$productDetails.retailPrice",
            wholesalePrice: "$productDetails.wholesalePrice",
          },
        },
      ]);

      // Assemble and return the salesman dashboard data
      const dashboardData = {
        assignedShops: {
          totalShops: assignedShops.length,
          shops: assignedShops,
        },
        todaysActivity: {
          orderCount: todaysOrders.length,
          orders: todaysOrders,
        },
        performance:
          salesPerformance.length > 0
            ? {
                monthlySales: salesPerformance[0].totalSales,
                orderCount: salesPerformance[0].orderCount,
                uniqueShopsServed: salesPerformance[0].uniqueShops.length,
              }
            : {
                monthlySales: 0,
                orderCount: 0,
                uniqueShopsServed: 0,
              },
        restockingSchedule,
        inventory,
      };

      return apiSuccess(
        res,
        "Salesman dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Salesman dashboard error:", error);
      return apiError(res, "Error fetching salesman dashboard data", error);
    }
  },

  /**
   * Get shop dashboard data
   * Includes order history, product recommendations, and return information
   */
  getShopDashboard: async (req, res) => {
    try {
      // Get user ID from authenticated user
      const shopUserId = req.user._id;

      // Find shop by user ID
      const shop = await Shop.findOne({ user: shopUserId });

      if (!shop) {
        return apiError(res, "Shop profile not found", 404);
      }

      const shopId = shop._id;

      // Get shop profile
      const shopProfile = await Shop.findById(shopId).select("-__v");

      // Get recent orders
      const recentOrders = await Order.find({
        shop: shopId,
        status: { $in: ["completed", "processing", "pending"] },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("salesman", "user")
        .select("totalAmount status createdAt");

      // Format recent orders with salesman name
      const formattedRecentOrders = await Promise.all(
        recentOrders.map(async (order) => {
          let salesmanName = "Unknown";
          if (order.salesman && order.salesman.user) {
            const salesmanUser = await User.findById(order.salesman.user);
            salesmanName = salesmanUser
              ? salesmanUser.fullName || salesmanUser.username
              : "Unknown";
          }

          return {
            orderId: order._id,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            salesmanName,
          };
        })
      );

      // Get order history by month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const orderHistory = await Order.aggregate([
        {
          $match: {
            shop: mongoose.Types.ObjectId(shopId),
            createdAt: { $gte: sixMonthsAgo },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalSpent: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      // Get frequently ordered products
      const frequentProducts = await OrderItem.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        {
          $match: {
            "orderDetails.shop": mongoose.Types.ObjectId(shopId),
            "orderDetails.status": "completed",
          },
        },
        {
          $group: {
            _id: "$product",
            orderCount: { $sum: 1 },
            totalQuantity: { $sum: "$quantity" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            orderCount: 1,
            totalQuantity: 1,
            retailPrice: "$productDetails.retailPrice",
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]);

      // Get recent returns
      const recentReturns = await Return.find({ shop: shopId })
        .sort({ returnDate: -1 })
        .limit(5)
        .select("totalAmount returnDate returnReason status");

      // Assemble and return the shop dashboard data
      const dashboardData = {
        shopProfile,
        recentOrders: formattedRecentOrders,
        orderHistory,
        frequentProducts,
        recentReturns,
      };

      return apiSuccess(
        res,
        "Shop dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Shop dashboard error:", error);
      return apiError(res, "Error fetching shop dashboard data", error);
    }
  },

  /**
   * Get sales summary for different time periods
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getSalesSummary: async (req, res) => {
    try {
      // Check if user is authorized
      if (!["owner", "warehouse_manager"].includes(req.user.role)) {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "30days" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get all orders in date range
      const orders = await Order.find({
        orderDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      });

      // Calculate total sales
      const totalSales = orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      // Get order items for the orders
      const orderIds = orders.map((order) => order._id);
      const orderItems = await OrderItem.find({
        order: { $in: orderIds },
      }).populate("product");

      // Calculate total units sold
      const totalUnitsSold = orderItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Calculate returns in the same period
      const returns = await Return.find({
        returnDate: { $gte: startDate, $lte: endDate },
      });

      const totalReturns = returns.reduce(
        (sum, returnDoc) => sum + returnDoc.totalAmount,
        0
      );

      // Calculate net sales
      const netSales = totalSales - totalReturns;

      // Count unique shops that placed orders
      const uniqueShops = [
        ...new Set(orders.map((order) => order.shop.toString())),
      ].length;

      // Group sales by date for trend analysis
      const salesByDate = {};
      orders.forEach((order) => {
        const dateKey = order.orderDate.toISOString().split("T")[0];
        if (!salesByDate[dateKey]) {
          salesByDate[dateKey] = 0;
        }
        salesByDate[dateKey] += order.totalAmount;
      });

      // Convert to array for frontend charting
      const salesTrend = Object.keys(salesByDate)
        .map((date) => ({
          date,
          amount: salesByDate[date],
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return apiSuccess(res, "Sales summary retrieved successfully", {
        totalSales,
        netSales,
        totalReturns,
        totalUnitsSold,
        uniqueShops,
        salesTrend,
        period,
      });
    } catch (error) {
      console.error("Sales summary error:", error);
      return apiError(res, "Error fetching sales summary", 500);
    }
  },

  /**
   * Get inventory summary
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getInventorySummary: async (req, res) => {
    try {
      // Check if user is authorized
      if (!["owner", "warehouse_manager"].includes(req.user.role)) {
        return apiError(res, "Unauthorized access", 403);
      }

      // Get all inventory items with their products
      const inventoryItems = await Inventory.find().populate("product");

      // Calculate total products in stock
      const totalStock = inventoryItems.reduce(
        (sum, item) => sum + item.currentStock,
        0
      );

      // Count products below threshold
      const lowStockItems = inventoryItems.filter(
        (item) => item.currentStock <= item.minimumThreshold
      );

      const lowStockCount = lowStockItems.length;

      // Get low stock items with details
      const lowStockDetails = lowStockItems.map((item) => ({
        productId: item.product._id,
        productName: item.product.productName,
        currentStock: item.currentStock,
        minimumThreshold: item.minimumThreshold,
        reorderQuantity: item.reorderQuantity,
      }));

      // Calculate inventory value
      const inventoryValue = inventoryItems.reduce((sum, item) => {
        const retailPrice = item.product.retailPrice || 0;
        return sum + item.currentStock * retailPrice;
      }, 0);

      // Get top 5 products by current stock
      const topStockProducts = [...inventoryItems]
        .sort((a, b) => b.currentStock - a.currentStock)
        .slice(0, 5)
        .map((item) => ({
          productId: item.product._id,
          productName: item.product.productName,
          currentStock: item.currentStock,
        }));

      return apiSuccess(res, "Inventory summary retrieved successfully", {
        totalStock,
        lowStockCount,
        lowStockDetails,
        inventoryValue,
        topStockProducts,
      });
    } catch (error) {
      console.error("Inventory summary error:", error);
      return apiError(res, "Error fetching inventory summary", 500);
    }
  },

  // Continuing from the getTopProducts endpoint...

  /**
   * Get top selling products
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getTopProducts: async (req, res) => {
    try {
      // Check if user is authorized
      if (!["owner", "warehouse_manager"].includes(req.user.role)) {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "30days", limit = 10 } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get orders within the period using aggregation for better performance
      const topProducts = await OrderItem.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        {
          $match: {
            "orderDetails.orderDate": { $gte: startDate, $lte: endDate },
            "orderDetails.status": "completed",
          },
        },
        {
          $group: {
            _id: "$product",
            totalQuantity: { $sum: "$quantity" },
            totalRevenue: { $sum: "$lineTotal" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$_id",
            productName: "$productDetails.productName",
            productType: "$productDetails.productType",
            quantity: "$totalQuantity",
            revenue: "$totalRevenue",
            orderCount: 1,
            averageUnitPrice: { $divide: ["$totalRevenue", "$totalQuantity"] },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: parseInt(limit) },
      ]);

      return apiSuccess(res, "Top products retrieved successfully", {
        topProducts,
        period,
      });
    } catch (error) {
      console.error("Top products error:", error);
      return apiError(res, "Error fetching top products", 500);
    }
  },

  /**
   * Get salesman performance metrics
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getSalesmanPerformance: async (req, res) => {
    try {
      // Check if user is owner
      if (req.user.role !== "owner") {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "30days" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Use aggregation to get performance metrics for all salesmen
      const salesmanPerformance = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$salesman",
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            uniqueShops: { $addToSet: "$shop" },
          },
        },
        {
          $lookup: {
            from: "salesmen",
            localField: "_id",
            foreignField: "_id",
            as: "salesmanDetails",
          },
        },
        { $unwind: "$salesmanDetails" },
        {
          $lookup: {
            from: "users",
            localField: "salesmanDetails.user",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            salesmanId: "$_id",
            name: {
              $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"],
            },
            userName: "$userDetails.username",
            totalSales: 1,
            orderCount: 1,
            uniqueShopCount: { $size: "$uniqueShops" },
            averageOrderValue: { $divide: ["$totalSales", "$orderCount"] },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get return metrics for each salesman
      const salesmanReturns = await Return.aggregate([
        {
          $match: {
            returnDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$salesman",
            totalReturns: { $sum: "$totalAmount" },
            returnCount: { $sum: 1 },
          },
        },
      ]);

      // Create a map of salesman IDs to their return data
      const returnsMap = {};
      salesmanReturns.forEach((item) => {
        returnsMap[item._id.toString()] = {
          totalReturns: item.totalReturns,
          returnCount: item.returnCount,
        };
      });

      // Get new shops registered by each salesman in the period
      const newShopsData = await Shop.aggregate([
        {
          $match: {
            registrationDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$createdBySalesman",
            newShopsCount: { $sum: 1 },
          },
        },
      ]);

      // Create a map of salesman IDs to their new shops count
      const newShopsMap = {};
      newShopsData.forEach((item) => {
        newShopsMap[item._id.toString()] = item.newShopsCount;
      });

      // Combine sales performance with returns data
      const completePerformanceData = salesmanPerformance.map((salesman) => {
        const salesmanId = salesman.salesmanId.toString();
        const returnData = returnsMap[salesmanId] || {
          totalReturns: 0,
          returnCount: 0,
        };
        const newShopsCount = newShopsMap[salesmanId] || 0;

        // Calculate return rate as percentage of sales
        const returnRate =
          salesman.totalSales > 0
            ? (returnData.totalReturns / salesman.totalSales) * 100
            : 0;

        return {
          ...salesman,
          totalReturns: returnData.totalReturns,
          returnCount: returnData.returnCount,
          returnRate: returnRate.toFixed(2),
          newShopsCount,
        };
      });

      return apiSuccess(res, "Salesman performance retrieved successfully", {
        salesmanPerformance: completePerformanceData,
        period,
      });
    } catch (error) {
      console.error("Salesman performance error:", error);
      return apiError(res, "Error fetching salesman performance", 500);
    }
  },

  /**
   * Get shop performance metrics
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getShopPerformance: async (req, res) => {
    try {
      // Check if user is authorized
      if (!["owner", "salesman"].includes(req.user.role)) {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "30days", limit = 20 } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // If user is a salesman, only include shops in their territory
      let matchStage = {
        orderDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      };

      if (req.user.role === "salesman") {
        const salesmanProfile = await Salesman.findOne({ user: req.user._id });
        if (!salesmanProfile) {
          return apiError(res, "Salesman profile not found", 404);
        }

        matchStage.salesman = salesmanProfile._id;
      }

      // Get shop performance data
      const shopPerformance = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$shop",
            totalPurchases: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            lastOrderDate: { $max: "$orderDate" },
            averageOrderValue: { $avg: "$totalAmount" },
            firstOrderDate: { $min: "$orderDate" },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "_id",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $project: {
            shopId: "$_id",
            shopName: "$shopDetails.shopName",
            address: "$shopDetails.address",
            phone: "$shopDetails.phone",
            totalPurchases: 1,
            orderCount: 1,
            lastOrderDate: 1,
            averageOrderValue: 1,
            daysSinceFirstOrder: {
              $divide: [
                { $subtract: [new Date(), "$firstOrderDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
        // Calculate daily purchase rate
        {
          $addFields: {
            dailyPurchaseRate: {
              $cond: [
                { $eq: ["$daysSinceFirstOrder", 0] },
                "$totalPurchases",
                { $divide: ["$totalPurchases", "$daysSinceFirstOrder"] },
              ],
            },
          },
        },
        { $sort: { totalPurchases: -1 } },
        { $limit: parseInt(limit) },
      ]);

      // Get return data for each shop
      const shopReturns = await Return.aggregate([
        {
          $match: {
            returnDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: "$shop",
            totalReturns: { $sum: "$totalAmount" },
            returnCount: { $sum: 1 },
          },
        },
      ]);

      // Create a map of shop IDs to their return data
      const returnsMap = {};
      shopReturns.forEach((item) => {
        returnsMap[item._id.toString()] = {
          totalReturns: item.totalReturns,
          returnCount: item.returnCount,
        };
      });

      // Combine performance with returns data and calculate return rate
      const completeShopData = shopPerformance.map((shop) => {
        const shopId = shop.shopId.toString();
        const returnData = returnsMap[shopId] || {
          totalReturns: 0,
          returnCount: 0,
        };

        // Calculate return rate as percentage of purchases
        const returnRate =
          shop.totalPurchases > 0
            ? (returnData.totalReturns / shop.totalPurchases) * 100
            : 0;

        // Calculate days since last order
        const daysSinceLastOrder = Math.floor(
          (new Date() - new Date(shop.lastOrderDate)) / (1000 * 60 * 60 * 24)
        );

        return {
          ...shop,
          totalReturns: returnData.totalReturns,
          returnCount: returnData.returnCount,
          returnRate: returnRate.toFixed(2),
          daysSinceLastOrder,
        };
      });

      return apiSuccess(res, "Shop performance retrieved successfully", {
        shopPerformance: completeShopData,
        period,
      });
    } catch (error) {
      console.error("Shop performance error:", error);
      return apiError(res, "Error fetching shop performance", 500);
    }
  },

  /**
   * Get revenue breakdown by geographic region
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getRevenueByRegion: async (req, res) => {
    try {
      // Check if user is owner
      if (req.user.role !== "owner") {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "30days" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "7days":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "30days":
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "90days":
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Get all orders within the period
      const orders = await Order.find({
        orderDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      }).populate("shop");

      // Extract region from shop address and group sales by region
      const regionData = {};

      for (const order of orders) {
        if (!order.shop || !order.shop.address) continue;

        // Extract region from address - simplified approach
        // In a real app, you would use properly structured address data
        // or geocoding to determine regions accurately
        const address = order.shop.address;
        const region = extractRegionFromAddress(address);

        if (!regionData[region]) {
          regionData[region] = {
            region,
            revenue: 0,
            orderCount: 0,
            shopCount: new Set(),
          };
        }

        regionData[region].revenue += order.totalAmount;
        regionData[region].orderCount += 1;
        regionData[region].shopCount.add(order.shop._id.toString());
      }

      // Convert to array and calculate shop count
      const formattedRegionData = Object.values(regionData).map((region) => ({
        region: region.region,
        revenue: region.revenue,
        orderCount: region.orderCount,
        shopCount: region.shopCount.size,
      }));

      // Sort by revenue
      formattedRegionData.sort((a, b) => b.revenue - a.revenue);

      return apiSuccess(res, "Revenue by region retrieved successfully", {
        revenueByRegion: formattedRegionData,
        period,
      });
    } catch (error) {
      console.error("Revenue by region error:", error);
      return apiError(res, "Error fetching revenue by region", 500);
    }
  },

  /**
   * Get financial overview
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getFinancialOverview: async (req, res) => {
    try {
      // Check if user is owner
      if (req.user.role !== "owner") {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "month" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case "day":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1); // Default to last month
      }

      // Get total sales
      const salesData = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      // Get returns data
      const returnsData = await Return.aggregate([
        {
          $match: {
            returnDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalReturns: { $sum: "$totalAmount" },
            returnCount: { $sum: 1 },
          },
        },
      ]);

      // Calculate gross profit
      // Need to get details of products sold
      const orderItemsData = await OrderItem.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        {
          $match: {
            "orderDetails.orderDate": { $gte: startDate, $lte: endDate },
            "orderDetails.status": "completed",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$lineTotal" },
            // For in-house products, use production cost
            // For third-party products, use purchase price
            totalCost: {
              $sum: {
                $cond: [
                  { $eq: ["$productDetails.productType", "in-house"] },
                  {
                    $multiply: [
                      "$quantity",
                      { $ifNull: ["$productDetails.productionCost", 0] },
                    ],
                  },
                  {
                    $multiply: [
                      "$quantity",
                      { $ifNull: ["$productDetails.purchasePrice", 0] },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

      // Get previous period data for comparison
      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(startDate);

      switch (period) {
        case "day":
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          break;
        case "week":
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          break;
        case "month":
          previousStartDate.setMonth(previousStartDate.getMonth() - 1);
          break;
        case "quarter":
          previousStartDate.setMonth(previousStartDate.getMonth() - 3);
          break;
        case "year":
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
          break;
      }

      // Get previous period sales
      const previousSalesData = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: previousStartDate, $lt: startDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      // Calculate financial metrics
      const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
      const totalReturns =
        returnsData.length > 0 ? returnsData[0].totalReturns : 0;
      const netSales = totalSales - totalReturns;

      const totalCost =
        orderItemsData.length > 0 ? orderItemsData[0].totalCost : 0;
      const grossProfit = netSales - totalCost;
      const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

      const previousSales =
        previousSalesData.length > 0 ? previousSalesData[0].totalSales : 0;
      const salesGrowth =
        previousSales > 0
          ? ((totalSales - previousSales) / previousSales) * 100
          : 0;

      return apiSuccess(res, "Financial overview retrieved successfully", {
        period,
        totalSales,
        totalReturns,
        netSales,
        totalCost,
        grossProfit,
        grossMargin: grossMargin.toFixed(2),
        salesGrowth: salesGrowth.toFixed(2),
        orderCount: salesData.length > 0 ? salesData[0].orderCount : 0,
        returnCount: returnsData.length > 0 ? returnsData[0].returnCount : 0,
        timeRange: {
          startDate,
          endDate,
        },
      });
    } catch (error) {
      console.error("Financial overview error:", error);
      return apiError(res, "Error fetching financial overview", 500);
    }
  },

  /**
   * Get inventory overview
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getInventoryOverview: async (req, res) => {
    try {
      // Check if user is authorized
      if (!["owner", "warehouse_manager"].includes(req.user.role)) {
        return apiError(res, "Unauthorized access", 403);
      }

      // Get all inventory with product details
      const inventoryItems = await Inventory.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $project: {
            productId: "$product",
            productName: "$productDetails.productName",
            productType: "$productDetails.productType",
            currentStock: 1,
            minimumThreshold: 1,
            reorderQuantity: 1,
            warehouseStock: 1,
            allocatedStock: 1,
            retailPrice: "$productDetails.retailPrice",
            wholesalePrice: "$productDetails.wholesalePrice",
            stockValue: {
              $multiply: ["$currentStock", "$productDetails.retailPrice"],
            },
          },
        },
      ]);

      // Calculate inventory summary metrics
      const totalProducts = inventoryItems.length;
      const totalStockValue = inventoryItems.reduce(
        (sum, item) => sum + item.stockValue,
        0
      );
      const totalStockCount = inventoryItems.reduce(
        (sum, item) => sum + item.currentStock,
        0
      );

      // Count products by stock status
      const lowStockProducts = inventoryItems.filter(
        (item) =>
          item.currentStock <= item.minimumThreshold && item.currentStock > 0
      );

      const outOfStockProducts = inventoryItems.filter(
        (item) => item.currentStock === 0
      );

      // Calculate allocated inventory (to salesmen)
      const allocatedValue = inventoryItems.reduce(
        (sum, item) => sum + item.allocatedStock * item.retailPrice,
        0
      );

      // Calculate warehouse inventory
      const warehouseValue = inventoryItems.reduce(
        (sum, item) => sum + item.warehouseStock * item.retailPrice,
        0
      );

      // Get inventory by product type
      const inHouseProducts = inventoryItems.filter(
        (item) => item.productType === "in-house"
      );
      const thirdPartyProducts = inventoryItems.filter(
        (item) => item.productType === "third-party"
      );

      const inHouseValue = inHouseProducts.reduce(
        (sum, item) => sum + item.stockValue,
        0
      );
      const thirdPartyValue = thirdPartyProducts.reduce(
        (sum, item) => sum + item.stockValue,
        0
      );

      return apiSuccess(res, "Inventory overview retrieved successfully", {
        summary: {
          totalProducts,
          totalStockValue,
          totalStockCount,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          allocatedValue,
          warehouseValue,
          inHouseProductsCount: inHouseProducts.length,
          thirdPartyProductsCount: thirdPartyProducts.length,
          inHouseValue,
          thirdPartyValue,
        },
        lowStockProducts: lowStockProducts.sort(
          (a, b) =>
            a.currentStock / a.minimumThreshold -
            b.currentStock / b.minimumThreshold
        ),
        outOfStockProducts: outOfStockProducts,
        // Top products by value
        topValueProducts: [...inventoryItems]
          .sort((a, b) => b.stockValue - a.stockValue)
          .slice(0, 10),
      });
    } catch (error) {
      console.error("Inventory overview error:", error);
      return apiError(res, "Error fetching inventory overview", 500);
    }
  },

  /**
   * Get sales overview
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  getSalesOverview: async (req, res) => {
    try {
      // Check if user is owner
      if (req.user.role !== "owner") {
        return apiError(res, "Unauthorized access", 403);
      }

      const { period = "month" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      let intervalType = "day"; // Default for breaking down sales by interval

      switch (period) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          intervalType = "day";
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          intervalType = "day";
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          intervalType = "week";
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          intervalType = "month";
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1); // Default to last month
          intervalType = "day";
      }

      // Format for grouping by interval
      let dateFormat = "%Y-%m-%d"; // Default for daily
      if (intervalType === "week") {
        dateFormat = "%Y-W%V"; // ISO week format
      } else if (intervalType === "month") {
        dateFormat = "%Y-%m"; // Year-month format
      }

      // Get sales by interval (day/week/month)
      const salesByInterval = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: "$orderDate" },
            },
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get sales by product category
      const salesByCategory = await OrderItem.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderDetails",
          },
        },
        { $unwind: "$orderDetails" },
        {
          $match: {
            "orderDetails.orderDate": { $gte: startDate, $lte: endDate },
            "orderDetails.status": "completed",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        { $unwind: "$productDetails" },
        {
          $group: {
            _id: "$productDetails.category", // Assuming products have a category field
            totalSales: { $sum: "$lineTotal" },
            unitsSold: { $sum: "$quantity" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get sales by payment method
      const salesByPaymentMethod = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Get sales by shop type
      const salesByShopType = await Order.aggregate([
        {
          $match: {
            orderDate: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "shop",
            foreignField: "_id",
            as: "shopDetails",
          },
        },
        { $unwind: "$shopDetails" },
        {
          $group: {
            _id: "$shopDetails.shopType", // Assuming shops have a type field
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            shopCount: { $addToSet: "$shop" },
          },
        },
        {
          $project: {
            shopType: "$_id",
            totalSales: 1,
            orderCount: 1,
            shopCount: { $size: "$shopCount" },
            averagePerShop: {
              $divide: ["$totalSales", { $size: "$shopCount" }],
            },
          },
        },
        { $sort: { totalSales: -1 } },
      ]);

      // Calculate sales summary
      const totalSales = salesByInterval.reduce(
        (sum, item) => sum + item.totalSales,
        0
      );
      const totalOrders = salesByInterval.reduce(
        (sum, item) => sum + item.orderCount,
        0
      );
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return apiSuccess(res, "Sales overview retrieved successfully", {
        period,
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue,
          timeRange: {
            startDate,
            endDate,
          },
        },
        salesByInterval,
        salesByCategory,
        salesByPaymentMethod,
        salesByShopType,
      });
    } catch (error) {
      console.error("Sales overview error:", error);
      return apiError(res, "Error fetching sales overview", 500);
    }
  },
};

/**
 * Helper function to extract region from address
 * This is a simplified example - in a real app, you would have proper
 * address structure or geocoding
 * @param {String} address - Full address string
 * @returns {String} - Extracted region
 */
function extractRegionFromAddress(address) {
  // This is just a simple example
  // In a real app, you might use a more sophisticated approach
  // like geocoding or having address fields properly structured

  if (!address) return "Unknown";

  // Look for state/province patterns
  const statePattern = /([A-Z]{2})[\s\d-]+$/i; // Like "NY 10001" at end of address
  const stateMatch = address.match(statePattern);

  if (stateMatch && stateMatch[1]) {
    return stateMatch[1].toUpperCase();
  }

  // Look for common city names followed by comma
  const cityPattern = /([A-Za-z\s]+),/;
  const cityMatch = address.match(cityPattern);

  if (cityMatch && cityMatch[1]) {
    return cityMatch[1].trim();
  }

  // Split by comma and take the last non-empty part
  const parts = address.split(",").filter((p) => p.trim());
  if (parts.length > 1) {
    return parts[parts.length - 2].trim(); // Usually state/province is second to last
  }

  // Fallback: use the first part of the address
  return parts[0].trim() || "Unknown";
}

module.exports = dashboardController;
