// server/utils/logger.js
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logDirectory = path.join(__dirname, "../logs");
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create error stream
const errorLogStream = fs.createWriteStream(
  path.join(logDirectory, "error.log"),
  { flags: "a" }
);

const logger = {
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ERROR: ${message}\n${
      error.stack || error
    }\n\n`;

    // Write to error log file
    errorLogStream.write(logEntry);

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error(message, error);
    }
  },

  info: (message) => {
    const timestamp = new Date().toISOString();

    // Log informational messages to console in development
    if (process.env.NODE_ENV !== "production") {
      console.info(`[${timestamp}] INFO: ${message}`);
    }
  },
};

module.exports = logger;
