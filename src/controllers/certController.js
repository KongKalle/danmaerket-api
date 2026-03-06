 const {
  getMemberBySigAndDomain,
  logRequest,
} = require("../services/memberService");

async function getCert(req, res) {
  const domain = req.normalizedSite;
  const sig = req.providedSig;

  const logBase = {
    sig,
    origin: req.headers["origin"],
    referer: req.headers["referer"],
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  };

  try {
    const member = await getMemberBySigAndDomain(sig, domain);

    if (!member) {
      await logRequest({ ...logBase, verdict: "invalid_sig" });
      return res.status(403).json({ valid: false, error: "invalid_credentials" });
    }

    const now = new Date();
    const expires = new Date(member.expires_at);

    if (!member.is_active || expires < now) {
      await logRequest({ ...logBase, verdict: "expired" });
      return res.status(403).json({ valid: false, error: "membership_expired" });
    }

    const verdict =
      req.originVerified === false && req.headers["origin"]
        ? "wrong_domain"
        : "valid";

    await logRequest({ ...logBase, verdict });

    return res.json({
      valid: true,
      shop_name: member.shop_name,
      verified: true,
      member_since:
  typeof member.member_since === "string"
    ? member.member_since
    : `${member.member_since.getFullYear()}-${String(member.member_since.getMonth() + 1).padStart(2, "0")}-${String(member.member_since.getDate()).padStart(2, "0")}`,
      categories: {
  identitet: member.scores?.identitet ?? 0,
  troværdighed:
    member.scores?.trovaerdighed ??
    member.scores?.["troværdighed"] ??
    0,
  teknisk: member.scores?.teknisk ?? 0,
},
    });
  } catch (err) {
    console.error("[certController]", err);
    return res.status(500).json({ valid: false, error: "server_error" });
  }
}

module.exports = { getCert };