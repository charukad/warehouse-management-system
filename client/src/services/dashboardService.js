// client/src/services/dashboardService.js

import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to inject the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const dashboardService = {
  // Get owner dashboard data with period filter
  getOwnerDashboard: async (period = "month") => {
    try {
      let url = `/dashboard/owner`;

      // Handle custom date range or standard period
      if (period.startsWith("custom")) {
        url += `?${period.substring(7)}`; // Remove 'custom&' and add the rest as query params
      } else {
        url += `?period=${period}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching owner dashboard data:", error);
      throw error;
    }
  },

  // Get warehouse manager dashboard data
  getWarehouseDashboard: async () => {
    try {
      const response = await api.get("/dashboard/warehouse");
      return response.data;
    } catch (error) {
      console.error("Error fetching warehouse dashboard data:", error);
      throw error;
    }
  },

  // Get salesman dashboard data
  getSalesmanDashboard: async () => {
    try {
      const response = await api.get("/dashboard/salesman");
      return response.data;
    } catch (error) {
      console.error("Error fetching salesman dashboard data:", error);
      throw error;
    }
  },

  // Get shop dashboard data
  getShopDashboard: async () => {
    try {
      const response = await api.get("/dashboard/shop");
      return response.data;
    } catch (error) {
      console.error("Error fetching shop dashboard data:", error);
      throw error;
    }
  },

  // Get sales summary data
  getSalesSummary: async (startDate, endDate) => {
    try {
      const response = await api.get(
        `/dashboard/sales-summary?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching sales summary:", error);
      throw error;
    }
  },

  // Get product performance data
  getProductPerformance: async (startDate, endDate, productId = null) => {
    try {
      let url = `/dashboard/product-performance?startDate=${startDate}&endDate=${endDate}`;
      if (productId) url += `&productId=${productId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching product performance:", error);
      throw error;
    }
  },

  // Get inventory status data
  getInventoryStatus: async () => {
    try {
      const response = await api.get("/dashboard/inventory-status");
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory status:", error);
      throw error;
    }
  },
};
