export async function POST(req) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { email, pkg } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const pkgNames = {
      A: "Package A - Essentials",
      B: "Package B - The Spread",
      C: "Package C - Omakase",
    };

    const pkgText = pkg ? "You selected " + (pkgNames[pkg] || pkg) + "." : "";

    const html =
      `<div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;background:#F5F0E8;">` +
      `<div style="background:#0c0c0c;padding:20px 32px;text-align:center;">` +
      `<img src="https://chefsspecialsushi.com/sonkase-logo.svg" alt="Sonkase Private Dining" width="200" height="58" style="display:block;margin:0 auto;max-width:100%;border:0;" />` +
      `</div>` +
      `<div style="padding:36px 32px;">` +
      `<p style="font-size:18px;color:#1a1208;margin:0 0 12px;font-family:Georgia,serif;">Welcome.</p>` +
      `<p style="font-size:15px;color:#5a4f3c;font-style:italic;line-height:1.65;margin-bottom:28px;">${pkgText} Click below to complete your booking.</p>` +
      `<a href="https://chefsspecialsushi.com/book" style="display:block;background:#E8C97E;color:#0c0c0c;text-align:center;padding:16px;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-family:Georgia,serif;">Complete Your Booking →</a>` +
      `</div>` +
      `<div style="background:#0c0c0c;padding:16px;text-align:center;">` +
      `<p style="font-size:10px;color:rgba(245,240,232,0.3);letter-spacing:0.2em;margin:0;">bookings@sonkase.com</p>` +
      `</div></div>`;

    await resend.emails.send({
      from: "Sonkase <bookings@sonkase.com>",
      to: email,
      subject: "Your Sonkase Booking Link",
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Email error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
