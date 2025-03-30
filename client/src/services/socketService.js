// client/src/services/socketService.js
import io from "socket.io-client";
import { store } from "../store";
import { addNotification } from "../store/slices/notificationSlice";

let socket;

// Initialize Socket.io connection
export const initializeSocket = (token) => {
  // Close existing connection if any
  if (socket) {
    socket.close();
  }

  // Create new connection with authentication
  socket = io(import.meta.env.VITE_API_URL, {
    auth: { token },
  });

  // Connection events
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  // Listen for notifications
  socket.on("notification", (notification) => {
    console.log("Received notification:", notification);
    store.dispatch(addNotification(notification));

    // Show browser notification if supported and permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png",
      });
    }
  });

  return socket;
};

// Request browser notification permission
export const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    if (
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }
  return false;
};

// Close Socket.io connection
export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Get socket instance
export const getSocket = () => socket;
