import crypto from "crypto";

// HMAC-signed admin session tokens. The password lives only in the
// ADMIN_PASSWORD env var (never in the client bundle) and doubles as the
// signing secret. Token format: <expiryMs>.<hex hmac of expiryMs>.
const secret = () => {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD is not set");
  return s;
};

export function issueAdminToken(days = 30) {
  const expires = Date.now() + days * 86400000;
  const sig = crypto.createHmac("sha256", secret()).update(String(expires)).digest("hex");
  return `${expires}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig) return false;
  if (Number(expires) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", secret()).update(String(expires)).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** Returns true when the request carries a valid admin bearer token. */
export function isAdminRequest(req) {
  const header = req.headers.get("authorization") || "";
  return verifyAdminToken(header.replace(/^Bearer\s+/i, ""));
}

/** 401 response helper for admin routes. */
export function adminUnauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
