// client/src/services/notificationService.js
// Create basic notification service for interacting with the API

const getUserNotifications = async (params = {}) => {
  // When you implement your API, this will call the endpoint
  // For now, return mock data
  return {
    data: {
      notifications: [
        {
          _id: "1",
          title: "Low Inventory Alert",
          message: "Sweet Treat A is below the minimum threshold.",
          notification_type: "warning",
          priority: "high",
          is_read: false,
          related_entity_type: "product",
          related_entity_id: "1",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          action_url: "/inventory",
        },
        {
          _id: "2",
          title: "New Order Received",
          message: 'Shop "Sweet Corner" has placed a new order.',
          notification_type: "info",
          priority: "medium",
          is_read: true,
          related_entity_type: "order",
          related_entity_id: "1",
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          action_url: "/orders/1",
        },
      ],
      pagination: {
        total: 2,
        page: params.page || 1,
        limit: params.limit || 20,
        pages: 1,
      },
    },
  };
};

const getUnreadCount = async () => {
  // When you implement your API, this will call the endpoint
  // For now, return mock data
  return {
    data: {
      count: 1,
    },
  };
};

const markAsRead = async (notificationId) => {
  // When you implement your API, this will call the endpoint
  // For now, return mock data
  return {
    data: {
      _id: notificationId,
      is_read: true,
      read_at: new Date().toISOString(),
    },
  };
};

const markAllAsRead = async () => {
  // When you implement your API, this will call the endpoint
  // For now, return mock success
  return {
    data: {
      success: true,
    },
  };
};

const deleteNotification = async (notificationId) => {
  // When you implement your API, this will call the endpoint
  // For now, return mock success
  return {
    data: {
      success: true,
    },
  };
};

export const notificationService = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
