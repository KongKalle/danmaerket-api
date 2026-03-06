 const { normalizeDomain } = require("./verifyHmac");

function originCheckMiddleware(req, res, next) {
  const origin = req.headers["origin"] || "";
  const referer = req.headers["referer"] || "";

  const source = origin || referer;

  if (!source) {
    req.originVerified = false;
    return next();
  }

  const originDomain = normalizeDomain(source);
  const claimedDomain = req.normalizedSite || "";

  const isMatch =
    originDomain === claimedDomain ||
    originDomain.endsWith("." + claimedDomain);

  req.originVerified = isMatch;
  req.originDomain = originDomain;

  if (!isMatch) {
    console.warn(
      `[ORIGIN MISMATCH] claimed=${claimedDomain} origin=${originDomain}`
    );
  }

  next();
}

module.exports = {
  originCheckMiddleware,
};