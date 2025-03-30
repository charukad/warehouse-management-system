// client/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";

// This is a placeholder for your actual authentication integration
// Replace this with your real authentication logic when you implement it
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real implementation, you would check localStorage for tokens
        // and validate them with your backend API
        const token = localStorage.getItem("token");

        if (token) {
          // Mock successful authentication for development
          // In real app, you would verify token with backend
          setUser({
            id: "1",
            username: "admin",
            name: "Admin User",
            role: "owner",
            email: "admin@sathirasweet.com",
          });
        }
      } catch (err) {
        setError(err);
        localStorage.removeItem("token");
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
      // In a real app, you would call your API to verify credentials
      // For now, simulate a successful login with mock data
      if (
        credentials.username === "admin" &&
        credentials.password === "password"
      ) {
        const user = {
          id: "1",
          username: "admin",
          name: "Admin User",
          role: "owner",
          email: "admin@sathirasweet.com",
        };

        // Store token in localStorage
        localStorage.setItem("token", "mock-token-for-development");
        setUser(user);
        return user;
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
