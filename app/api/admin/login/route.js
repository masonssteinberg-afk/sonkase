import crypto from "crypto";
import { issueAdminToken } from "@/lib/adminAuth";

export async function POST(req) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return Response.json({ error: "Admin auth not configured" }, { status: 500 });
    }
    const a = Buffer.from(String(password ?? ""));
    const b = Buffer.from(expected);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) return Response.json({ error: "Invalid password" }, { status: 401 });
    return Response.json({ token: issueAdminToken() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
