// client/src/components/common/NotificationContainer.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUI } from "../../hooks/useUI";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"; // Fixed import
import { Button } from "../ui/button"; // Fixed import

const NotificationContainer = () => {
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);

  // This would normally come from your Redux store
  // Simulating notification system for now
  useEffect(() => {
    const handleNotification = (notification) => {
      // Add notification to the stack
      setNotifications((prev) => [notification, ...prev].slice(0, 5));
      setVisible(true);

      // Auto-dismiss after timeout if not error
      if (notification.type !== "error") {
        setTimeout(() => {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id)
          );
          if (notifications.length === 1) {
            setVisible(false);
          }
        }, notification.duration || 5000);
      }
    };

    // Example: simulate a notification after 2 seconds
    const timer = setTimeout(() => {
      handleNotification({
        id: "1",
        title: "Welcome to Sathira Sweet",
        message: "System loaded successfully.",
        type: "info",
        duration: 5000,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Dismiss a notification
  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notifications.length === 1) {
      setVisible(false);
    }
  };

  // Different styles based on notification type
  const getAlertVariant = (type) => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
      default:
        return "info";
    }
  };

  if (!visible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-md space-y-2 transition-all">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={getAlertVariant(notification.type)}
          className="relative shadow-lg"
        >
          <Button
            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
            onClick={() => dismissNotification(notification.id)}
            variant="outline"
          >
            <X size={16} />
          </Button>
          {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default NotificationContainer;
