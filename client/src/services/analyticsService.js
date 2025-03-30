// client/src/services/analyticsService.js

import api from "./api";

export const analyticsService = {
  // Calculate key performance indicators
  calculateKPIs: (data, options = {}) => {
    const {
      salesData,
      returnData,
      inventoryData,
      compareWithPreviousPeriod = false,
    } = data;

    // Calculate sales metrics
    const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
    const orderCount = salesData.length;
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    // Calculate return rate
    const totalReturns = returnData.reduce((sum, item) => sum + item.amount, 0);
    const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0;

    // Calculate inventory turnover
    const inventoryValue = inventoryData.reduce(
      (sum, item) => sum + item.cost * item.quantity,
      0
    );
    const cogs = salesData.reduce((sum, item) => sum + item.cost, 0);
    const inventoryTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;

    // Other KPIs
    const netProfit = totalSales - cogs - totalReturns;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // If we need to compare with previous period
    let comparison = {};
    if (compareWithPreviousPeriod && options.previousPeriodData) {
      const {
        salesData: prevSalesData,
        returnData: prevReturnData,
        inventoryData: prevInventoryData,
      } = options.previousPeriodData;

      const prevTotalSales = prevSalesData.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const salesGrowth =
        prevTotalSales > 0
          ? ((totalSales - prevTotalSales) / prevTotalSales) * 100
          : 0;

      comparison = {
        salesGrowth,
        // Add more comparisons as needed
      };
    }

    return {
      totalSales,
      orderCount,
      averageOrderValue,
      returnRate,
      inventoryTurnover,
      netProfit,
      profitMargin,
      comparison,
    };
  },

  // Analyze sales trends
  analyzeSalesTrends: (salesData, options = {}) => {
    const { groupBy = "day", calculateGrowth = true } = options;

    // Group sales data by the specified time period
    const groupedData = {};

    salesData.forEach((sale) => {
      const date = new Date(sale.date);
      let groupKey;

      switch (groupBy) {
        case "day":
          groupKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week":
          // Get the week number
          const startOfYear = new Date(date.getFullYear(), 0, 1);
          const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
          groupKey = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case "month":
          groupKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          break;
        case "quarter":
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          groupKey = `${date.getFullYear()}-Q${quarter}`;
          break;
        case "year":
          groupKey = date.getFullYear().toString();
          break;
        default:
          groupKey = date.toISOString().split("T")[0]; // Default to day
      }

      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          period: groupKey,
          totalSales: 0,
          orderCount: 0,
          items: 0,
        };
      }

      groupedData[groupKey].totalSales += sale.amount;
      groupedData[groupKey].orderCount += 1;
      groupedData[groupKey].items += sale.items?.length || 0;
    });

    // Convert to array and sort by period
    let result = Object.values(groupedData).sort((a, b) =>
      a.period.localeCompare(b.period)
    );

    // Calculate growth if requested
    if (calculateGrowth && result.length > 1) {
      result = result.map((item, index) => {
        if (index === 0) {
          return { ...item, growth: 0 };
        }

        const previousSales = result[index - 1].totalSales;
        const growth =
          previousSales > 0
            ? ((item.totalSales - previousSales) / previousSales) * 100
            : 0;

        return { ...item, growth };
      });
    }

    return result;
  },

  // Get predicted sales for the next period
  getPredictedSales: async (historicalData, options = {}) => {
    try {
      const response = await api.post("/analytics/predict-sales", {
        historicalData,
        options,
      });

      return response.data;
    } catch (error) {
      console.error("Error predicting sales:", error);
      throw error;
    }
  },

  // Get product recommendations for a shop
  getProductRecommendations: async (shopId, options = {}) => {
    try {
      const response = await api.get(
        `/analytics/product-recommendations/${shopId}`,
        {
          params: options,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error getting product recommendations:", error);
      throw error;
    }
  },

  // Get optimal route for a salesman
  getOptimalRoute: async (salesmanId, shops, options = {}) => {
    try {
      const response = await api.post(
        `/analytics/optimal-route/${salesmanId}`,
        {
          shops,
          options,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error calculating optimal route:", error);
      throw error;
    }
  },
};
