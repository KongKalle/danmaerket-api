 const db = require("../db/index");
const { getCached, setCache } = require("./cacheService");

async function getMemberBySigAndDomain(sig, domain) {
  const cacheKey = `cert:${domain}`;
  const cached = await getCached(cacheKey);

  if (cached) return cached;

  const [rows] = await db.execute(
    `
    SELECT
      m.id,
      m.shop_name,
      m.shop_domain,
      m.member_since,
      m.expires_at,
      m.is_active,
      s.revoked_at,
      JSON_OBJECTAGG(sc.category, sc.score) AS scores
    FROM dm_signatures s
    JOIN dm_members m  ON m.id = s.member_id
    LEFT JOIN dm_scores sc ON sc.member_id = m.id
    WHERE s.signature   = ?
      AND m.shop_domain = ?
      AND s.revoked_at  IS NULL
    GROUP BY m.id, s.revoked_at
    LIMIT 1
  `,
    [sig, domain]
  );

  if (!rows.length) return null;

  const row = rows[0];
  console.log("RAW SCORES:", row.scores);

  const result = {
  id: row.id,
  shop_name: row.shop_name,
  shop_domain: row.shop_domain,
  member_since: row.member_since,
  expires_at: row.expires_at,
  is_active: row.is_active === 1,
  scores:
    typeof row.scores === "string"
      ? JSON.parse(row.scores)
      : (row.scores || {}),
};

  if (result.is_active) {
    await setCache(cacheKey, result);
  }

  return result;
}

async function logRequest(data) {
  await db.execute(
    `
    INSERT INTO dm_widget_requests
      (signature, origin_header, referer_header, ip, user_agent, verdict)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      data.sig ? data.sig.slice(0, 64) : null,
      data.origin ? data.origin.slice(0, 253) : null,
      data.referer ? data.referer.slice(0, 500) : null,
      data.ip || null,
      data.userAgent ? data.userAgent.slice(0, 500) : null,
      data.verdict || null,
    ]
  );
}

module.exports = {
  getMemberBySigAndDomain,
  logRequest,
};