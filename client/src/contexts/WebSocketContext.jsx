// client/src/contexts/WebSocketContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dashboardUpdates, setDashboardUpdates] = useState({});

  useEffect(() => {
    if (!user) return;

    // Initialize WebSocket connection
    const ws = new WebSocket(
      process.env.REACT_APP_WS_URL || "ws://localhost:8080"
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      // Authenticate the WebSocket connection
      ws.send(
        JSON.stringify({
          type: "auth",
          token: localStorage.getItem("token"),
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle different types of messages
      switch (data.type) {
        case "notification":
          setNotifications((prev) => [data.notification, ...prev]);
          break;
        case "dashboard_update":
          setDashboardUpdates((prev) => ({
            ...prev,
            [data.dashboard]: data.data,
          }));
          break;
        case "inventory_alert":
          // Handle inventory alerts
          setNotifications((prev) => [
            {
              id: Date.now(),
              title: "Inventory Alert",
              message: `${data.productName} is below minimum threshold (${data.currentStock}/${data.minimumThreshold})`,
              type: "warning",
              timestamp: new Date(),
            },
            ...prev,
          ]);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      // You might want to implement reconnection logic here
    };

    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user]);

  // Function to send a message through the WebSocket
  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  };

  // Clear a notification
  const clearNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <WebSocketContext.Provider
      value={{
        notifications,
        dashboardUpdates,
        sendMessage,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
