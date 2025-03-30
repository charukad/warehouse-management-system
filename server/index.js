// server/index.js
const express = require("express");
const http = require("http");
const connectDB = require("./config/database");
const { initializeSocket } = require("./config/socket");
const routes = require("./routes");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Setup request logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs", "access.log"),
  { flags: "a" }
);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("combined", { stream: accessLogStream })); // Request logging

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// API Routes
app.use("/api", routes);

// Serve static files from uploads directory
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// In production, serve the React build files
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5008;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server; // Export for testing
