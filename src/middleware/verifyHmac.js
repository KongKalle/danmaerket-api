 function normalizeDomain(raw = "") {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .split("/")[0];
}

async function verifySignatureMiddleware(req, res, next) {
  const { site, sig } = req.query;

  if (!site || !sig) {
    return res.status(400).json({ valid: false, error: "missing_params" });
  }

  if (!/^[a-f0-9]{64}$/.test(sig)) {
    return res.status(400).json({ valid: false, error: "invalid_sig_format" });
  }

  req.normalizedSite = normalizeDomain(site);
  req.providedSig = sig;

  next();
}

module.exports = {
  normalizeDomain,
  verifySignatureMiddleware,
};