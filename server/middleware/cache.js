// server/middleware/cache.js
const { getAsync, setAsync } = require("../config/redis");

// Cache middleware for frequently accessed data
const cacheMiddleware = (expirationTime = 3600) => {
  return async (req, res, next) => {
    // Create a unique cache key based on the route and query parameters
    const cacheKey = `api:${req.originalUrl}`;

    try {
      // Check if data exists in cache
      const cachedData = await getAsync(cacheKey);

      if (cachedData) {
        // Return cached data if it exists
        const data = JSON.parse(cachedData);
        return res.json(data);
      }

      // Store the original send function
      const originalSend = res.send;

      // Override the send function to cache the response
      res.send = function (body) {
        // Only cache successful responses
        if (res.statusCode === 200) {
          setAsync(cacheKey, body, "EX", expirationTime).catch((err) =>
            console.error("Redis caching error:", err)
          );
        }

        // Call the original send function
        originalSend.call(this, body);
      };

      // Continue to the route handler
      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Cache invalidation function for when data is updated
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      // Logic to delete cached keys matching the pattern
      // This is a simplified version and might need to be adjusted
      // based on your Redis implementation
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => delAsync(key)));
      }
      next();
    } catch (error) {
      console.error("Cache invalidation error:", error);
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
