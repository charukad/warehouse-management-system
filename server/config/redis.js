// server/config/redis.js
const redis = require("redis");
const { promisify } = require("util");

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || "",
});

redisClient.on("error", (error) => {
  console.error("Redis Error:", error);
});

redisClient.on("connect", () => {
  console.log("Redis connected successfully");
});

// Promisify Redis functions for async/await usage
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

module.exports = {
  redisClient,
  getAsync,
  setAsync,
  delAsync,
  expireAsync,
};
