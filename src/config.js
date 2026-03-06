require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  hmacSecret: process.env.DM_HMAC_SECRET || "",
  db: {
    host: process.env.DB_HOST || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  },
  redis: {
    url: process.env.REDIS_URL || "",
  },
  cors: {
    allowedOrigins: /^https?:\/\//,
  },
  cache: {
    ttlSeconds: 300,
  },
  rateLimit: {
    windowMs: 60000,
    max: 30,
  },
};