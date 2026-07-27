// CAN-SPAM unsubscribe endpoint. Marketing emails must link here
// (e.g. https://sonakase.com/api/unsubscribe?email=...) and must also
// include a physical mailing address in the email footer.
import { createClient } from "@supabase/supabase-js";

const page = (title, body) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>` +
    `<body style="background:#0d0d0d;color:#F5F0E8;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px;">` +
    `<div><div style="font-size:22px;margin-bottom:12px;">${title}</div>` +
    `<div style="font-size:15px;color:rgba(245,240,232,0.6);line-height:1.6;">${body}</div>` +
    `<a href="/" style="display:inline-block;margin-top:24px;color:#E8C97E;font-size:14px;">← Back to Sonakase</a></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

export async function GET(req) {
  try {
    const email = String(new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
    if (!email.includes("@")) {
      return page("Something went wrong", "That unsubscribe link is missing an email address.");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    await supabase.from("subscribers").update({ unsubscribed: true }).eq("email", email);

    // Same response whether or not the email was on the list.
    return page("You're unsubscribed", "You won't receive marketing emails from Sonakase. Booking confirmations for events you reserve are unaffected.");
  } catch {
    return page("Something went wrong", "Please try the link again in a moment.");
  }
}
