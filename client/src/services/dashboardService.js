// client/src/services/dashboardService.js
// Create a dashboard service for fetching analytics data

const getSalesSummary = async (period = "month") => {
  // Mock data for sales summary
  const data = {
    totalSales: 125850,
    totalOrders: 320,
    averageOrderValue: 393.28,
    previousPeriod: {
      totalSales: 112400,
      totalOrders: 295,
      averageOrderValue: 380.67,
    },
    percentChange: {
      totalSales: 11.96,
      totalOrders: 8.47,
      averageOrderValue: 3.31,
    },
  };

  return { data };
};

const getSalesmanPerformance = async (period = "month") => {
  // Mock data for salesman performance
  const data = [
    {
      id: "1",
      name: "John Doe",
      sales: 45200,
      orders: 112,
      shops: 18,
      returnRate: 3.2,
    },
    {
      id: "2",
      name: "Jane Smith",
      sales: 38750,
      orders: 98,
      shops: 15,
      returnRate: 2.5,
    },
    {
      id: "3",
      name: "Robert Johnson",
      sales: 41900,
      orders: 110,
      shops: 16,
      returnRate: 4.1,
    },
  ];

  return { data };
};

const getTopProducts = async (limit = 5) => {
  // Mock data for top products
  const data = [
    {
      id: "1",
      name: "Sweet Treat A",
      sales: 28500,
      units: 114,
      profit: 11400,
    },
    {
      id: "2",
      name: "Sweet Treat B",
      sales: 23400,
      units: 78,
      profit: 9360,
    },
    {
      id: "3",
      name: "Third Party Sweet",
      sales: 21350,
      units: 61,
      profit: 7900,
    },
    {
      id: "4",
      name: "Chocolate Delight",
      sales: 18700,
      units: 55,
      profit: 6545,
    },
    {
      id: "5",
      name: "Vanilla Dream",
      sales: 15800,
      units: 53,
      profit: 5530,
    },
  ];

  return { data };
};

const getInventorySummary = async () => {
  // Mock data for inventory summary
  const data = {
    totalProducts: 25,
    totalStock: 3250,
    lowStockItems: 4,
    outOfStockItems: 1,
    stockValue: 325000,
  };

  return { data };
};

const getSalesOverTime = async (period = "year", interval = "month") => {
  // Mock data for sales over time
  let data = [];

  if (interval === "day" && period === "month") {
    // Daily data for the last month
    for (let i = 1; i <= 30; i++) {
      data.push({
        date: `2023-05-${i.toString().padStart(2, "0")}`,
        sales: Math.floor(Math.random() * 5000) + 3000,
      });
    }
  } else if (interval === "month" && period === "year") {
    // Monthly data for the last year
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (let i = 0; i < 12; i++) {
      data.push({
        date: months[i],
        sales: Math.floor(Math.random() * 50000) + 30000,
      });
    }
  }

  return { data };
};

export const dashboardService = {
  getSalesSummary,
  getSalesmanPerformance,
  getTopProducts,
  getInventorySummary,
  getSalesOverTime,
};
