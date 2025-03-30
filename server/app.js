// server/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import the database connection
const connectDB = require("./config/database");

// Import middlewares
const errorHandler = require("./middleware/errorHandler");

// Create Express app
const app = express();

// Setup request logging
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const accessLogStream = fs.createWriteStream(path.join(logsDir, "access.log"), {
  flags: "a",
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("combined", { stream: accessLogStream })); // Request logging

// Health check route
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    database: dbStatus,
  });
});

// Helper function to safely load route modules
const safeRequire = (routePath) => {
  try {
    const route = require(routePath);
    if (!route || typeof route !== "function") {
      console.error(
        `Warning: Route module ${routePath} does not export a function`
      );
      return express.Router(); // Return empty router as fallback
    }
    return route;
  } catch (error) {
    console.error(`Error loading route module ${routePath}:`, error.message);
    return express.Router(); // Return empty router as fallback
  }
};

// Import and use API routes - with safer route loading
app.use("/api/auth", safeRequire("./routes/auth"));
app.use("/api/users", safeRequire("./routes/users"));
app.use("/api/products", safeRequire("./routes/products"));
app.use("/api/inventory", safeRequire("./routes/inventory"));
app.use("/api/distribution", safeRequire("./routes/distribution"));
app.use("/api/shops", safeRequire("./routes/shops"));
app.use("/api/orders", safeRequire("./routes/orders"));
app.use("/api/returns", safeRequire("./routes/returns"));
app.use("/api/reports", safeRequire("./routes/reports"));
app.use("/api/dashboard", safeRequire("./routes/dashboard"));

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

// Start the server if this file is run directly
if (require.main === module) {
  // Connect to MongoDB first, then start the Express server
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 5008;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(
          `Health check available at: http://localhost:${PORT}/api/health`
        );
        console.log(
          `API endpoints available at: http://localhost:${PORT}/api/...`
        );
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB, server not started", err);
    });
} else {
  // When imported (not directly run), still connect to the database
  // This is useful for testing scenarios
  connectDB().catch((err) => console.error("Database connection error:", err));

  // Export the app
  module.exports = app;
}
