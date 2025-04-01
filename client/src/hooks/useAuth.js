// client/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import apiService from "../services/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token) {
          // IMPORTANT: Explicitly set the token in headers before making the request
          apiService.setAuthToken(token);

          try {
            // Try to validate with the backend using correct endpoint
            const response = await apiService.get("/auth/me");

            if (response.success) {
              setUser(response.data.user);
              // Update stored user
              localStorage.setItem("user", JSON.stringify(response.data.user));
            } else {
              // If backend validation fails but we have a stored user, use that
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              } else {
                localStorage.removeItem("token");
              }
            }
          } catch (apiError) {
            console.error("Auth check error:", apiError);

            // If API call fails but we have stored user data, use that instead
            if (storedUser) {
              console.log("Using stored user data as fallback");
              setUser(JSON.parse(storedUser));
            } else {
              localStorage.removeItem("token");
            }
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);

        // Final fallback - try to use stored user data
        try {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            localStorage.removeItem("token");
          }
        } catch (parseError) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with credentials:", {
        username: credentials.username,
        password: "********", // Hide password in logs for security
      });

      // Call the login API endpoint
      const response = await apiService.post("/auth/login", credentials);
      console.log("Login successful:", response);

      // Save the authentication token
      if (response.token) {
        apiService.setAuthToken(response.token);
      } else if (response.data && response.data.token) {
        apiService.setAuthToken(response.data.token);
      }

      // Update user state with returned user data
      // Handle different response structures
      const userData =
        response.user ||
        (response.data ? response.data.user : null) ||
        response.data;

      if (userData) {
        setUser(userData);
        // Store user data in local storage as a fallback
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("User data set:", userData);
      } else {
        console.warn("No user data found in response:", response);
      }

      return response;
    } catch (err) {
      console.error("Login error:", err);

      // Format error message from server response or use generic message
      const errorMessage =
        err.customMessage ||
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your credentials and try again.";

      setError(errorMessage);
      throw { ...err, customMessage: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Sending registration data to server:", {
        ...userData,
        password: "********", // Hide password in logs for security
      });

      // Call the registration API endpoint
      const response = await apiService.post("/auth/register", userData);
      console.log("Registration successful:", response);

      // Option 1: Automatically log the user in after registration
      if (response.token) {
        apiService.setAuthToken(response.token);
        setUser(response.user || response.data);
        localStorage.setItem(
          "user",
          JSON.stringify(response.user || response.data)
        );
      } else if (response.data && response.data.token) {
        apiService.setAuthToken(response.data.token);
        setUser(response.data.user || response.data);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user || response.data)
        );
      }

      return response;
    } catch (err) {
      console.error(
        "Registration error:",
        err.response?.data || err.message || err
      );

      // Format error message from server response or use generic message
      const errorMessage =
        err.customMessage ||
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
  }, []);

  // Logout function
  const logout = useCallback(() => {
    apiService.setAuthToken(null);
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Get user's role
  const getUserRole = useCallback(() => {
    if (!user) return null;
    return user.role || null;
  }, [user]);

  // Determine dashboard URL based on user role
  const getDashboardUrl = useCallback(() => {
    if (!user) return "/dashboard";

    // Extract role from user data
    const role = user.role || (user.data && user.data.role);

    console.log("Determining dashboard URL for role:", role);

    // Map roles to their appropriate starting pages
    switch (role) {
      case "owner":
        return "/reports";
      case "warehouse_manager":
        return "/inventory";
      case "salesman":
        return "/shops";
      case "shop":
        return "/orders";
      default:
        return "/dashboard";
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    getUserRole,
    getDashboardUrl,
  };
};

export default useAuth;
