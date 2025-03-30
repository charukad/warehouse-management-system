// server/services/notificationService.js
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  sendUserNotification,
  sendRoleNotification,
} = require("../config/socket");

/**
 * Creates a new notification
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} - The created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Sends a notification to a specific user
 * @param {string} userId - The recipient user ID
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {Object} options - Additional notification options
 * @returns {Promise<Object>} - The created notification
 */
const sendNotification = async (userId, title, message, options = {}) => {
  try {
    const notificationData = {
      recipient_user_id: userId,
      title,
      message,
      notification_type: options.type || "info",
      priority: options.priority || "medium",
      related_entity_type: options.entityType || "system",
      related_entity_id: options.entityId,
      action_url: options.actionUrl,
      expires_at: options.expiresAt,
    };

    const notification = await createNotification(notificationData);

    // Send real-time notification via Socket.io
    sendUserNotification(userId, notification);

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Sends a notification to all users with a specific role
 * @param {string} role - The user role
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {Object} options - Additional notification options
 * @returns {Promise<Array>} - The created notifications
 */
const sendNotificationByRole = async (role, title, message, options = {}) => {
  try {
    // Find all users with the specified role
    const users = await User.find({ user_type: role });

    if (!users.length) {
      console.warn(`No users found with role: ${role}`);
      return [];
    }

    // Create notifications for each user
    const notificationPromises = users.map((user) =>
      createNotification({
        recipient_user_id: user._id,
        title,
        message,
        notification_type: options.type || "info",
        priority: options.priority || "medium",
        related_entity_type: options.entityType || "system",
        related_entity_id: options.entityId,
        action_url: options.actionUrl,
        expires_at: options.expiresAt,
      })
    );

    const notifications = await Promise.all(notificationPromises);

    // Send real-time notification to all users with the role
    const notificationToSend = {
      title,
      message,
      notification_type: options.type || "info",
      priority: options.priority || "medium",
      related_entity_type: options.entityType || "system",
      created_at: new Date().toISOString(),
    };

    sendRoleNotification(role, notificationToSend);

    return notifications;
  } catch (error) {
    console.error("Error sending notifications by role:", error);
    throw error;
  }
};

/**
 * Marks a notification as read
 * @param {string} notificationId - The notification ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The updated notification
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient_user_id: userId,
      },
      {
        is_read: true,
        read_at: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      throw new Error("Notification not found or unauthorized");
    }

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Marks all notifications for a user as read
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - The result of the update operation
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient_user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );

    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
// server/services/notificationService.js (continued)
/**
 * Gets notifications for a user
 * @param {string} userId - The user ID
 * @param {Object} options - Query options (pagination, filters)
 * @returns {Promise<Array>} - The notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      isRead,
      priority,
      type,
      entityType,
    } = options;

    const query = { recipient_user_id: userId };

    // Add filters if provided
    if (isRead !== undefined) {
      query.is_read = isRead;
    }

    if (priority) {
      query.priority = priority;
    }

    if (type) {
      query.notification_type = type;
    }

    if (entityType) {
      query.related_entity_type = entityType;
    }

    const skip = (page - 1) * limit;

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

/**
 * Gets unread notification count for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Number>} - The unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipient_user_id: userId,
      is_read: false,
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw error;
  }
};

/**
 * Deletes a notification
 * @param {string} notificationId - The notification ID
 * @param {string} userId - The user ID
 * @returns {Promise<Boolean>} - Success status
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient_user_id: userId,
    });

    if (result.deletedCount === 0) {
      throw new Error("Notification not found or unauthorized");
    }

    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// Helper function to create alert notifications for inventory thresholds
const createInventoryAlert = async (product, currentStock) => {
  try {
    // Get warehouse managers and owner
    const managers = await User.find({
      user_type: { $in: ["owner", "warehouse_manager"] },
    });

    if (!managers.length) {
      console.warn("No managers found to notify about low inventory");
      return [];
    }

    const title = `Low Inventory Alert: ${product.product_name}`;
    const message = `Current stock (${currentStock}) is below the minimum threshold (${product.min_stock_level}).`;

    const options = {
      type: "warning",
      priority: "high",
      entityType: "product",
      entityId: product._id,
      actionUrl: `/inventory/products/${product._id}`,
    };

    // Send notifications to all managers
    const notificationPromises = managers.map((manager) =>
      sendNotification(manager._id, title, message, options)
    );

    return await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error creating inventory alert:", error);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendNotification,
  sendNotificationByRole,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
  getUnreadCount,
  deleteNotification,
  createInventoryAlert,
};
