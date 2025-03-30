// server/index.js
const express = require("express");
const http = require("http");
const connectDB = require("./config/database");
const { initializeSocket } = require("./config/socket");
const routes = require("./routes");
const cors = require("cors");
require("dotenv").config();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
