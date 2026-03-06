const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { createClient } = require("redis");
const config = require("../config");

let redisClient;
let redisStore;

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

  redisStore = new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  });
}

const widgetRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,

  store: undefined,

  keyGenerator: (req) => {
    const sig = req.query.sig || "nosig";
    return `${ipKeyGenerator(req)}:${sig.slice(0, 8)}`;
  },

  handler: (req, res) => {
    res.status(429).json({ valid: false, error: "rate_limited" });
  },
});

function attachRateLimitStore() {
  if (redisStore) {
    widgetRateLimiter.store = redisStore;
  }
}

module.exports = {
  widgetRateLimiter,
  initRateLimitRedis,
  attachRateLimitStore,
};