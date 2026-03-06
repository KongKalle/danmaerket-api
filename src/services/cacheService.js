 const { createClient } = require("redis");
const config = require("../config");

let client;

async function initRedis() {
  if (!config.redis.url) {
    console.warn("Redis URL ikke sat – cache deaktiveret");
    return;
  }

  client = createClient({ url: config.redis.url });

  client.on("error", (err) => {
    console.error("Redis fejl:", err);
  });

  await client.connect();
}

async function getCached(key) {
  if (!client) return null;

  const raw = await client.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function setCache(key, value, ttlSeconds = config.cache.ttlSeconds) {
  if (!client) return;

  await client.setEx(key, ttlSeconds, JSON.stringify(value));
}

async function invalidateCache(domain) {
  if (!client) return;

  await client.del(`cert:${domain}`);
}

module.exports = {
  initRedis,
  getCached,
  setCache,
  invalidateCache,
};