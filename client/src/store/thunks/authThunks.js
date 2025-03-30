// client/src/store/thunks/authThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import {
  initializeSocket,
  requestNotificationPermission,
} from "../../services/socketService";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      // Store token in localStorage
      localStorage.setItem("token", response.data.token);

      // Initialize Socket.io connection
      // client/src/store/thunks/authThunks.js (continued)
      // Initialize Socket.io connection
      initializeSocket(response.data.token);

      // Request notification permission
      requestNotificationPermission();

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Close Socket.io connection
      await authService.logout();

      // Remove token from localStorage
      localStorage.removeItem("token");

      // Close Socket.io connection
      closeSocket();

      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Other auth thunks...
