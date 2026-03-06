 const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { createClient } = require("redis");
const config = require("../config");

let redisClient;

async function initRateLimitRedis() {
  if (!config.redis.url) {
    console.warn("Redis URL mangler – rate limit kører uden Redis");
    return;
  }

  redisClient = createClient({ url: config.redis.url });

  redisClient.on("error", (err) => {
    console.error("Redis rate limit fejl:", err);
  });

  await redisClient.connect();
}

const widgetRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,

  store: redisClient
    ? new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined,

  keyGenerator: (req) => {
    const sig = req.query.sig || "nosig";
    return `${req.ip}:${sig.slice(0, 8)}`;
  },

  handler: (req, res) => {
    res.status(429).json({ valid: false, error: "rate_limited" });
  },
});

module.exports = {
  widgetRateLimiter,
  initRateLimitRedis,
};