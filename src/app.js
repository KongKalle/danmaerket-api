const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const certRouter = require("./routes/cert");
const internalRouter = require("./routes/internal");
const {
  initRateLimitRedis,
  attachRateLimitStore,
} = require("./middleware/rateLimit");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: true,
  methods: ["GET", "POST"],
  maxAge: 300,
}));

app.use(express.json());

(async () => {
  try {
    await initRateLimitRedis();
    attachRateLimitStore();
  } catch (err) {
    console.error("Rate limit Redis init fejl:", err);
  }
})();

app.use("/api/v1", certRouter);
app.use("/internal", internalRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "danmaerket-api" });
});

module.exports = app;