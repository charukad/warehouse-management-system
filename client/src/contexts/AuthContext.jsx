// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

// Create the Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Auth State - Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Set the token in axios headers
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Fetch current user data
          const response = await api.get("/api/auth/me");
          setUser(response.data.data.user);
          setRoleDetails(response.data.data.roleDetails);
        } catch (err) {
          console.error("Auth initialization error:", err);
          // Handle expired or invalid token
          logout();
          setError("Your session has expired. Please log in again.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/api/auth/register", userData);
      const { token, user, roleDetails } = response.data.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Set token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setToken(token);
      setUser(user);
      setRoleDetails(roleDetails);

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/api/auth/login", credentials);
      const { token, user, roleDetails } = response.data.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Set token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update state
      setToken(token);
      setUser(user);
      setRoleDetails(roleDetails);

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      // Call logout API endpoint (optional)
      if (token) {
        await api.post("/api/auth/logout");
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem("token");

      // Remove token from axios headers
      delete api.defaults.headers.common["Authorization"];

      // Reset state
      setToken(null);
      setUser(null);
      setRoleDetails(null);
    }
  };

  // Update user password
  const updatePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put("/api/auth/update-password", passwordData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Password update failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - request reset
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/api/auth/forgot-password", { email });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Password reset request failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleDetails,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updatePassword,
        forgotPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
