const express = require("express");
const crypto = require("crypto");
const db = require("../db/index");
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

    return res.json({ ok: true, domain });
  } catch (err) {
    console.error("[cache invalidate]", err);
    return res.status(500).json({ error: "server_error" });
  }
});

router.post("/member/sync", requireInternalKey, async (req, res) => {
  try {
    const {
      post_id,
      domain,
      shop_name,
      member_since,
      expires_at,
      is_active,
      scores = {},
    } = req.body;

    if (!domain || !shop_name || !member_since || !expires_at) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const normalizedDomain = String(domain)
      .toLowerCase()
      .trim()
      .replace(/^www\./, "");

    const [existingRows] = await db.execute(
      `SELECT id FROM dm_members WHERE shop_domain = ? LIMIT 1`,
      [normalizedDomain]
    );

    let memberId;

    if (existingRows.length) {
      memberId = existingRows[0].id;

      await db.execute(
        `
        UPDATE dm_members
        SET shop_name = ?, member_since = ?, expires_at = ?, is_active = ?, wp_user_id = ?
        WHERE id = ?
        `,
        [
          shop_name,
          member_since,
          expires_at,
          is_active ? 1 : 0,
          post_id || null,
          memberId,
        ]
      );
    } else {
      const [insertResult] = await db.execute(
        `
        INSERT INTO dm_members
          (shop_domain, shop_name, member_since, expires_at, is_active, wp_user_id)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          normalizedDomain,
          shop_name,
          member_since,
          expires_at,
          is_active ? 1 : 0,
          post_id || null,
        ]
      );

      memberId = insertResult.insertId;
    }

    const [sigRows] = await db.execute(
      `SELECT signature FROM dm_signatures WHERE member_id = ? AND revoked_at IS NULL LIMIT 1`,
      [memberId]
    );

    let signature;

    if (sigRows.length) {
      signature = sigRows[0].signature;
    } else {
      signature = crypto.randomBytes(32).toString("hex");

      await db.execute(
        `INSERT INTO dm_signatures (member_id, signature) VALUES (?, ?)`,
        [memberId, signature]
      );
    }

    const scoreMap = {
      identitet: Number(scores.identitet ?? 0),
      "troværdighed": Number(scores["troværdighed"] ?? 0),
      teknisk: Number(scores.teknisk ?? 0),
    };

    for (const [category, score] of Object.entries(scoreMap)) {
      await db.execute(
        `
        INSERT INTO dm_scores (member_id, category, score)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE score = VALUES(score)
        `,
        [memberId, category, score]
      );
    }

    await invalidateCache(normalizedDomain);

    return res.json({
      ok: true,
      member_id: memberId,
      domain: normalizedDomain,
      signature,
    });
  } catch (err) {
    console.error("[member sync]", err);
    return res.status(500).json({ error: "server_error" });
  }
});

module.exports = router;