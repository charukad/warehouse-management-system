// server/config/socket.js
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

// Initialize Socket.io
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Join a room specific to this user
    socket.join(`user:${socket.user._id}`);

    // Join a room for the user's role
    socket.join(`role:${socket.user.user_type}`);

    // Disconnect event
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
    });
  });

  return io;
};

// Send a notification to a specific user
const sendUserNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
};

// Send a notification to all users with a specific role
const sendRoleNotification = (role, notification) => {
  if (io) {
    io.to(`role:${role}`).emit("notification", notification);
  }
};

// Send a notification to all users
const sendAllNotification = (notification) => {
  if (io) {
    io.emit("notification", notification);
  }
};

module.exports = {
  initializeSocket,
  sendUserNotification,
  sendRoleNotification,
  sendAllNotification,
  getIO: () => io,
};
