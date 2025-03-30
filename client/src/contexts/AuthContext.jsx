// client/src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          return;
        }

        // Set token in axios defaults
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Fetch user data
        const response = await api.get("/api/auth/me");
        setUser(response.data.data);
        setError(null);
      } catch (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        setError("Failed to authenticate. Please log in again.");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await api.post("/api/auth/login", credentials);
      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setError(null);
      return user;
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to log in. Please check your credentials."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await api.post("/api/auth/register", userData);
      const { token, user } = response.data.data;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      setError(null);
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.message || "Failed to register. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await api.put("/api/auth/profile", userData);
      setUser(response.data.data);
      setError(null);
      return response.data.data;
    } catch (error) {
      console.error("Update profile error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      await api.post("/api/auth/forgot-password", { email });
      setError(null);
    } catch (error) {
      console.error("Forgot password error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to process password reset request. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      await api.post("/api/auth/reset-password", { token, password });
      setError(null);
    } catch (error) {
      console.error("Reset password error:", error);
      setError(
        error.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
