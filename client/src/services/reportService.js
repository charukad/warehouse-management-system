// client/src/services/reportService.js

import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  // Use Vite's environment variable approach instead of process.env
  baseURL: import.meta.env.VITE_API_URL || "/api",
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

export const reportService = {
  // Generate financial report
  generateFinancialReport: async (startDate, endDate, format = "pdf") => {
    try {
      // For PDF, we need to set responseType to 'blob'
      const responseType = format === "pdf" ? "blob" : "json";

      const response = await api.get(
        `/reports/financial?startDate=${startDate}&endDate=${endDate}&format=${format}`,
        { responseType }
      );

      if (format === "pdf") {
        // Create a blob from the PDF stream
        const blob = new Blob([response.data], { type: "application/pdf" });

        // Create a link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `financial_report_${startDate}_to_${endDate}.pdf`
        );
        document.body.appendChild(link);
        link.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        return true;
      } else {
        // For JSON, just return the data
        return response.data;
      }
    } catch (error) {
      console.error("Error generating financial report:", error);
      throw error;
    }
  },

  // Generate inventory report
  generateInventoryReport: async (startDate, endDate, format = "pdf") => {
    try {
      const responseType = format === "pdf" ? "blob" : "json";

      const response = await api.get(
        `/reports/inventory?startDate=${startDate}&endDate=${endDate}&format=${format}`,
        { responseType }
      );

      if (format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `inventory_report_${startDate}_to_${endDate}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        return true;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
      throw error;
    }
  },

  // Generate salesman performance report
  generateSalesmanReport: async (
    salesmanId,
    startDate,
    endDate,
    format = "pdf"
  ) => {
    try {
      const responseType = format === "pdf" ? "blob" : "json";

      const response = await api.get(
        `/reports/salesman-performance?salesmanId=${salesmanId}&startDate=${startDate}&endDate=${endDate}&format=${format}`,
        { responseType }
      );

      if (format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `salesman_report_${salesmanId}_${startDate}_to_${endDate}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        return true;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error("Error generating salesman report:", error);
      throw error;
    }
  },

  // Generate product performance report
  generateProductReport: async (
    productId,
    startDate,
    endDate,
    format = "pdf"
  ) => {
    try {
      const responseType = format === "pdf" ? "blob" : "json";

      const response = await api.get(
        `/reports/product-performance?productId=${productId}&startDate=${startDate}&endDate=${endDate}&format=${format}`,
        { responseType }
      );

      if (format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `product_report_${productId}_${startDate}_to_${endDate}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        return true;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error("Error generating product report:", error);
      throw error;
    }
  },

  // Get shop performance data
  getShopPerformance: async (startDate, endDate, shopId = null) => {
    try {
      let url = `/reports/shop-performance?startDate=${startDate}&endDate=${endDate}`;
      if (shopId) url += `&shopId=${shopId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error getting shop performance:", error);
      throw error;
    }
  },

  // Get returns analysis data
  getReturnsAnalysis: async (startDate, endDate) => {
    try {
      const response = await api.get(
        `/reports/returns-analysis?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting returns analysis:", error);
      throw error;
    }
  },

  // Generate custom report
  generateCustomReport: async (config, format = "pdf") => {
    try {
      const responseType = format === "pdf" ? "blob" : "json";

      const response = await api.post(
        `/reports/custom?format=${format}`,
        config,
        { responseType }
      );

      if (format === "pdf") {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `custom_report_${new Date().toISOString().slice(0, 10)}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        return true;
      } else {
        return response.data;
      }
    } catch (error) {
      console.error("Error generating custom report:", error);
      throw error;
    }
  },
};
