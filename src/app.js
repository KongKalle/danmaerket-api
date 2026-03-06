const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const certRouter = require("./routes/cert");
const config = require("./config");
const internalRouter = require("./routes/internal");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: true,
  methods: ["GET", "POST"],
  maxAge: 300,
}));

app.use(express.json());

app.use("/api/v1", certRouter);
app.use("/internal", internalRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "danmaerket-api" });
});

module.exports = app;