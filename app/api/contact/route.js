export async function POST(req) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Sonakase <bookings@sonakase.com>",
      to: "masonssteinberg@gmail.com",
      subject: `Sonakase™ Inquiry — ${name}`,
      html: `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#f5f0e8;padding:0;">` +
        `<div style="background:#0d0d0d;padding:28px 32px;">` +
        `<div style="font-size:11px;color:#E8C97E;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:4px;">Sonakase™ · Inquiry</div>` +
        `<div style="font-size:18px;color:#F5F0E8;font-weight:400;">New message from ${name}</div>` +
        `</div>` +
        `<div style="padding:32px;">` +
        `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">` +
        `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(14,14,14,0.1);font-size:10px;color:#E8C97E;letter-spacing:0.2em;text-transform:uppercase;padding-right:20px;white-space:nowrap;">Name</td>` +
        `<td style="padding:10px 0;border-bottom:1px solid rgba(14,14,14,0.1);font-size:15px;color:#0d0d0d;">${name}</td></tr>` +
        `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(14,14,14,0.1);font-size:10px;color:#E8C97E;letter-spacing:0.2em;text-transform:uppercase;padding-right:20px;white-space:nowrap;">Email</td>` +
        `<td style="padding:10px 0;border-bottom:1px solid rgba(14,14,14,0.1);font-size:15px;color:#0d0d0d;">${email}</td></tr>` +
        `</table>` +
        `<div style="font-size:10px;color:#E8C97E;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:10px;">Message</div>` +
        `<div style="font-size:15px;color:#0d0d0d;line-height:1.7;white-space:pre-wrap;">${message}</div>` +
        `</div>` +
        `<div style="background:#0d0d0d;padding:16px 32px;text-align:center;">` +
        `<p style="font-size:10px;color:rgba(245,240,232,0.3);letter-spacing:0.2em;margin:0;">sonakase.com</p>` +
        `</div></div>`,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Contact route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
