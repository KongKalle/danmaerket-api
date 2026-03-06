const express = require("express");
const { invalidateCache } = require("../services/cacheService");

const router = express.Router();

function requireInternalKey(req, res, next) {
  if (req.headers["x-internal-key"] !== process.env.DM_INTERNAL_KEY) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

router.post("/cache/invalidate", requireInternalKey, async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: "missing_domain" });
    }

    await invalidateCache(domain);

    res.json({ ok: true, domain });
  } catch (err) {
    console.error("[cache invalidate]", err);
    res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;