// server/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  notification_type: {
    type: String,
    enum: ["alert", "info", "warning", "success"],
    default: "info",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  related_entity_type: {
    type: String,
    enum: ["order", "product", "inventory", "shop", "return", "user", "system"],
    required: true,
  },
  related_entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  action_url: {
    type: String,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  read_at: {
    type: Date,
  },
  expires_at: {
    type: Date,
  },
});

// Index for faster queries on recipient and read status
notificationSchema.index({ recipient_user_id: 1, is_read: 1 });
// Index for time-based expiration (TTL index)
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
