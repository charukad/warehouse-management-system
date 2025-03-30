require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");

// Get port from environment variables or use default
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
