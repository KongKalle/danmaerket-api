const express = require("express");

const { widgetRateLimiter } = require("../middleware/rateLimit");
const { verifySignatureMiddleware } = require("../middleware/verifyHmac");
const { originCheckMiddleware } = require("../middleware/originCheck");
const { getCert } = require("../controllers/certController");

const router = express.Router();

router.get(
  "/cert",
  widgetRateLimiter,
  verifySignatureMiddleware,
  originCheckMiddleware,
  getCert
);

module.exports = router;