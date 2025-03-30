// client/src/components/common/NotificationBell.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} from "../../store/slices/notificationSlice";
import { formatDistanceToNow } from "date-fns";

const NotificationBell = () => {
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );

  // Fetch notifications on component mount
  useEffect(() => {
    dispatch(fetchNotifications());

    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    dispatch(markAsRead(notification._id));

    // Navigate to the action URL if present
    if (notification.action_url) {
      // You would use your routing library here (React Router)
      // history.push(notification.action_url);
    }

    // Close dropdown
    setDropdownOpen(false);
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case "alert":
        return "⚠️";
      case "warning":
        return "⚠️";
      case "success":
        return "✅";
      case "info":
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div
                      className={`h-3 w-3 rounded-full mt-1 mr-3 ${getPriorityColor(
                        notification.priority
                      )}`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            { addSuffix: true }
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-1 text-xs text-gray-500">
                        {getTypeIcon(notification.notification_type)}{" "}
                        {notification.related_entity_type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length > 20 && (
                <div className="p-3 text-center">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      /* Load more logic */
                    }}
                  >
                    View all
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
