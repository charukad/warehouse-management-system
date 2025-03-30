// server/routes/notifications.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { auth } = require("../middleware/auth");

// Get user notifications with optional filters
router.get("/", auth, notificationController.getUserNotifications);

// Get unread notification count
router.get("/unread-count", auth, notificationController.getUnreadCount);

// Mark a notification as read
router.patch("/:notificationId/read", auth, notificationController.markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", auth, notificationController.markAllAsRead);

// Delete a notification
router.delete(
  "/:notificationId",
  auth,
  notificationController.deleteNotification
);

module.exports = router;
