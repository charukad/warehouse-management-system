// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Create API instance with your server's base URL
const api = axios.create({
  baseURL: "http://localhost:5008/api", // Update this to match your server URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Configure request interceptor to automatically attach authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create the authentication context
const AuthContext = createContext();

// Auth provider component that wraps your application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing authentication when the component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          try {
            // Validate token with your API
            const response = await api.get("/auth/validate");
            setUser(response.data.user || response.data.data);
          } catch (validationError) {
            // Token is invalid or expired
            console.error("Token validation failed:", validationError);
            localStorage.removeItem("token");
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Authentication failed. Please login again.");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function to authenticate users
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with credentials:", {
        username: credentials.username,
        password: "********", // Hide password in logs for security
      });

      // Call your login API endpoint
      const response = await api.post("/auth/login", credentials);
      console.log("Login successful:", response.data);

      // Save the authentication token
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      } else if (response.data.data && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token);
      }

      // Update user state with returned user data
      // Handle different response structures
      const userData =
        response.data.user ||
        (response.data.data ? response.data.data.user : null) ||
        response.data.data;

      if (userData) {
        setUser(userData);
        console.log("User data set:", userData);
      } else {
        console.warn("No user data found in response:", response.data);
      }

      return response.data;
    } catch (err) {
      console.error("Login error details:", err);
      console.error("Login error response:", err.response?.data);

      // Format error message from server response or use generic message
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials and try again.";

      setError(errorMessage);
      throw { ...err, customMessage: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registration function - named to match what the Register component expects
  const registerUser = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Sending registration data to server:", {
        ...userData,
        password: "********", // Hide password in logs for security
      });

      // Call your registration API endpoint
      const response = await api.post("/auth/register", userData);
      console.log("Registration successful:", response.data);

      // Option 1: Automatically log the user in after registration
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setUser(response.data.user || response.data.data);
      } else if (response.data.data && response.data.data.token) {
        localStorage.setItem("token", response.data.data.token);
        setUser(response.data.data.user || response.data.data);
      }

      return response.data;
    } catch (err) {
      console.error(
        "Registration error details:",
        err.response?.data || err.message || err
      );

      // Format error message from server response or use generic message
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";

      // Extract validation errors if available
      const validationErrors = err.response?.data?.errors;

      setError(errorMessage);
      throw {
        ...err,
        customMessage: errorMessage,
        validationErrors,
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function to clear authentication state
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Request password reset function
  const requestPasswordReset = async (email) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Requesting password reset for email:", email);

      // Call your password reset request API endpoint
      const response = await api.post("/auth/forgot-password", { email });
      console.log("Password reset request successful:", response.data);

      return response.data;
    } catch (err) {
      console.error(
        "Password reset request error:",
        err.response?.data || err.message || err
      );

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to send password reset. Please try again.";

      setError(errorMessage);
      throw { ...err, customMessage: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function using token
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Resetting password using token");

      // Call your password reset API endpoint
      const response = await api.post("/auth/reset-password", {
        token,
        password: newPassword,
      });

      console.log("Password reset successful:", response.data);
      return response.data;
    } catch (err) {
      console.error(
        "Password reset error:",
        err.response?.data || err.message || err
      );

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to reset password. Please try again.";

      setError(errorMessage);
      throw { ...err, customMessage: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get user's role from user data
  const getUserRole = () => {
    if (!user) return null;
    return user.role || null;
  };

  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    const role = getUserRole();
    switch (role) {
      case "owner":
        return "/owner/Dashboard";
      case "warehouse_manager":
        return "/warehouse/dashboard";
      case "salesman":
        return "/salesman/dashboard";
      case "shop":
        return "/shop/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Prepare the context value with all authentication functions and state
  const value = {
    user,
    loading,
    error,
    login,
    registerUser, // Using the name expected by the Register component
    register: registerUser, // Providing an alias for backward compatibility
    logout,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user, // Boolean indicating authentication status
    getUserRole,
    getDashboardUrl,
  };

  // Provide the authentication context to child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily use the auth context in components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
