// server/controllers/notificationController.js
const notificationService = require("../services/notificationService");
const apiResponse = require("../utils/apiResponse");

/**
 * Get notifications for the authenticated user
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      isRead:
        req.query.isRead !== undefined
          ? req.query.isRead === "true"
          : undefined,
      priority: req.query.priority,
      type: req.query.type,
      entityType: req.query.entityType,
    };

    const result = await notificationService.getUserNotifications(
      req.user.id,
      options
    );

    return apiResponse.success(
      res,
      "Notifications retrieved successfully",
      result
    );
  } catch (error) {
    console.error("Error getting notifications:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    return apiResponse.success(res, "Unread count retrieved successfully", {
      count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(
      notificationId,
      req.user.id
    );

    return apiResponse.success(
      res,
      "Notification marked as read",
      notification
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);

    return apiResponse.success(res, "All notifications marked as read", result);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return apiResponse.error(res, error.message);
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationService.deleteNotification(notificationId, req.user.id);

    return apiResponse.success(res, "Notification deleted successfully");
  } catch (error) {
    console.error("Error deleting notification:", error);
    return apiResponse.error(res, error.message);
  }
};
