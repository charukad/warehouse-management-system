// client/src/services/api.js
import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5008",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Check if the error is due to an expired token
      if (
        error.response.data.message ===
        "Your session has expired. Please log in again."
      ) {
        // Clear local storage
        localStorage.removeItem("token");

        // Redirect to login page if not already there
        if (window.location.pathname !== "/login") {
          // Store the current location to redirect back after login
          localStorage.setItem("redirectAfterLogin", window.location.pathname);

          // Redirect to login
          window.location.href = "/login?expired=true";
        }
      }
    }

    // Server is down or not reachable
    if (!error.response) {
      console.error("Network Error:", error);
      error.customMessage =
        "Cannot connect to server. Please check your internet connection.";
    }

    // Handle validation errors
    if (error.response && error.response.data.errors) {
      error.validationErrors = error.response.data.errors;
    }

    // Add the error message from the server response if available
    if (error.response && error.response.data.message) {
      error.customMessage = error.response.data.message;
    }

    return Promise.reject(error);
  }
);

// Generic API request methods with error handling
const apiService = {
  // GET request
  async get(url, config = {}) {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // POST request
  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // PUT request
  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // DELETE request
  async delete(url, config = {}) {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // PATCH request
  async patch(url, data = {}, config = {}) {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  // Error handling helper
  handleError(error) {
    // Log the error for debugging
    console.error("API Error:", error);

    // You can implement additional error handling logic here
    // For example, showing a notification or logging to an error tracking service
  },

  // Method to set auth token
  setAuthToken(token) {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete api.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  },
};

export default apiService;
export { api }; // Export the axios instance for direct use if needed
