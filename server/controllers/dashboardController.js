// server/controllers/dashboardController.js

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Shop = require("../models/Shop");
const User = require("../models/User");
const Return = require("../models/Return");
const Inventory = require("../models/Inventory");
const apiResponse = require("../utils/apiResponse");

/**
 * Dashboard Controller
 * Provides aggregated data for role-specific dashboards
 */
const dashboardController = {
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

      return apiResponse.success(
        res,
        "Dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Owner dashboard error:", error);
      return apiResponse.error(res, "Error fetching dashboard data", error);
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

      return apiResponse.success(
        res,
        "Warehouse dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Warehouse dashboard error:", error);
      return apiResponse.error(
        res,
        "Error fetching warehouse dashboard data",
        error
      );
    }
  },

  /**
   * Get salesman dashboard data
   * Includes daily targets, shop information, delivery schedule, and performance metrics
   */
  getSalesmanDashboard: async (req, res) => {
    try {
      // Get user ID from authenticated user
      const salesmanId = req.user.id;

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get salesman's assigned shops
      const assignedShops = await Shop.find({
        createdBySalesmanId: salesmanId,
        isActive: true,
      }).select(
        "shopId shopName address phone latitude longitude lastOrderDate"
      );

      // Get today's orders
      const todaysOrders = await Order.aggregate([
        {
          $match: {
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "shopId",
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
            salesmanId: mongoose.Types.ObjectId(salesmanId),
            createdAt: { $gte: currentMonth },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            orderCount: { $sum: 1 },
            uniqueShops: { $addToSet: "$shopId" },
          },
        },
      ]);

      // Get shops that need restocking
      const restockingSchedule = await Shop.aggregate([
        {
          $match: {
            createdBySalesmanId: mongoose.Types.ObjectId(salesmanId),
            isActive: true,
          },
        },
        {
          $lookup: {
            from: "restockingschedules",
            localField: "_id",
            foreignField: "shopId",
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
      const inventory = await Inventory.aggregate([
        { $match: { salesmanId: mongoose.Types.ObjectId(salesmanId) } },
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
            allocatedQuantity: 1,
            remainingQuantity: 1,
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

      return apiResponse.success(
        res,
        "Salesman dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Salesman dashboard error:", error);
      return apiResponse.error(
        res,
        "Error fetching salesman dashboard data",
        error
      );
    }
  },

  /**
   * Get shop dashboard data
   * Includes order history, product recommendations, and return information
   */
  getShopDashboard: async (req, res) => {
    try {
      // Get user ID from authenticated user
      const shopId = req.user.shopId;

      // Get shop profile
      const shopProfile = await Shop.findById(shopId).select("-__v");

      // Get recent orders
      const recentOrders = await Order.find({
        shopId,
        status: { $in: ["completed", "processing", "pending"] },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("salesmanId", "fullName")
        .select("orderId totalAmount status createdAt");

      // Get order history by month
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const orderHistory = await Order.aggregate([
        {
          $match: {
            shopId: mongoose.Types.ObjectId(shopId),
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
      const frequentProducts = await Order.aggregate([
        {
          $match: {
            shopId: mongoose.Types.ObjectId(shopId),
            status: "completed",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            orderCount: { $sum: 1 },
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
            orderCount: 1,
            totalQuantity: 1,
            retailPrice: "$productDetails.retailPrice",
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]);

      // Get recent returns
      const recentReturns = await Return.find({ shopId })
        .sort({ returnDate: -1 })
        .limit(5)
        .select("returnId totalAmount returnDate returnReason status");

      // Assemble and return the shop dashboard data
      const dashboardData = {
        shopProfile,
        recentOrders,
        orderHistory,
        frequentProducts,
        recentReturns,
      };

      return apiResponse.success(
        res,
        "Shop dashboard data retrieved successfully",
        dashboardData
      );
    } catch (error) {
      console.error("Shop dashboard error:", error);
      return apiResponse.error(
        res,
        "Error fetching shop dashboard data",
        error
      );
    }
  },
};

module.exports = dashboardController;
