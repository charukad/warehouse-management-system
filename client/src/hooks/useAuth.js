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
            // Try to validate with the backend
            const response = await apiService.get("/auth/me");

            if (response.success) {
              setUser(response.data.user);
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

  // Login function - this part seems to be working correctly
  const login = useCallback(async (credentials) => {
    // Your existing login code
    // ...
  }, []);

  // Rest of your useAuth hook
  // ...
};
