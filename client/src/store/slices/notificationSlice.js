// client/src/store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationService } from "../../services/notificationService";

// Async thunks for notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUserNotifications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUnreadCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    unreadCount: 0,
    pagination: {
      total: 0,
      page: 1,
      limit: 20,
      pages: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {
    // Add a new notification (e.g., from WebSocket)
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
    // Clear all notifications
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (notification) => notification._id === action.payload._id
        );
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      })

      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }));
        state.unreadCount = 0;
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (notification) => notification._id === action.payload
        );
        if (index !== -1) {
          const wasUnread = !state.notifications[index].is_read;
          state.notifications.splice(index, 1);
          if (wasUnread && state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
        }
      });
  },
});

export const { addNotification, clearNotifications } =
  notificationSlice.actions;

export default notificationSlice.reducer;
