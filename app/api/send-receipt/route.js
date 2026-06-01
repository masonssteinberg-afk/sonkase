export async function POST(req) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const {
      email, confirmationId, packageName, eventDate, guestCount,
      total, deposit, appetizers, promoCode, discountAmount,
      serviceType, appetizerChoice, chefNotes, eventTime, appetizersSelected,
    } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const fmt2    = (n) => "$" + Number(n).toFixed(2);
    const fmtDate = (d) => {
      if (!d) return "—";
      const [y, m, day] = d.split("-");
      return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    };
    const fmtTime = (v) => {
      if (!v) return "—";
      const [h, m] = v.split(":").map(Number);
      const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
    };

    // ── Shared building blocks ────────────────────────────────────
    const LOGO = `<div style="background:#0c0c0c;padding:24px 32px;text-align:center;">` +
      `<img src="https://chefsspecialsushi.com/sonkase-logo.svg" alt="Sonkase Private Dining" width="220" height="64" style="display:block;margin:0 auto;max-width:100%;border:0;" />` +
      `</div>`;

    const FOOTER = `<div style="background:#0c0c0c;padding:20px;text-align:center;">` +
      `<p style="font-size:10px;color:rgba(245,240,232,0.25);letter-spacing:0.2em;margin:0;">Don't see this email? Check spam — bookings@sonkase.com</p>` +
      `</div>`;

    const row = (label, value) =>
      `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px dotted rgba(232,201,126,0.2);">` +
      `<span style="font-size:10px;color:#b8892a;letter-spacing:0.22em;text-transform:uppercase;white-space:nowrap;padding-right:16px;">${label}</span>` +
      `<span style="font-size:14px;color:#1a1208;font-family:Georgia,serif;text-align:right;">${value || "—"}</span>` +
      `</div>`;

    // ── Omakase receipt ───────────────────────────────────────────
    if (serviceType === "omakase") {
      const appetizersStr = Array.isArray(appetizersSelected) ? appetizersSelected.join(", ") : (appetizersSelected || "—");
      const html =
        `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
        LOGO +
        `<div style="background:#E8C97E;padding:13px;text-align:center;">` +
        `<div style="font-size:11px;color:#0c0c0c;letter-spacing:0.4em;text-transform:uppercase;font-weight:bold;">Experience Confirmed</div>` +
        `</div>` +
        `<div style="padding:36px 32px;">` +
        `<p style="font-size:16px;color:#1a1208;font-style:italic;margin:0 0 28px;line-height:1.65;">Your Sonkase experience is confirmed. Here are your details.</p>` +
        `<div style="background:#fff;border:1px solid rgba(184,137,42,0.25);padding:20px 24px;margin-bottom:24px;">` +
        row("Confirmation", confirmationId) +
        row("Experience", packageName) +
        row("Date", fmtDate(eventDate)) +
        row("Time", fmtTime(eventTime)) +
        row("Guests", guestCount ? `${guestCount} guests` : "—") +
        row("Appetizer(s)", appetizersStr) +
        row("Total", fmt2(total)) +
        row("Deposit Charged", fmt2(deposit)) +
        row("Balance Due", `$${(Number(total) - Number(deposit)).toFixed(2)} — due at the event`) +
        `</div>` +
        (chefNotes
          ? `<div style="background:#fff;border:1px solid rgba(184,137,42,0.25);padding:16px 24px;margin-bottom:24px;">` +
            `<div style="font-size:10px;color:#b8892a;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:8px;">Your Notes to the Chef</div>` +
            `<div style="font-size:14px;color:#5a4f3c;font-style:italic;">${chefNotes}</div>` +
            `</div>` : "") +
        `<div style="padding:18px 22px;background:rgba(184,137,42,0.07);border-left:2px solid #E8C97E;">` +
        `<div style="font-size:10px;color:#b8892a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:10px;">What Happens Next</div>` +
        `<ul style="font-size:14px;color:#5a4f3c;line-height:1.9;margin:0;padding-left:18px;font-style:italic;">` +
        `<li>Your chef will review your notes before the event</li>` +
        `<li>Chef arrives 30 minutes before your selected time to set up</li>` +
        `<li>Balance is due at the event — cash or card accepted</li>` +
        `</ul></div></div>` +
        FOOTER + `</div>`;

      await resend.emails.send({
        from: "Sonkase <bookings@sonkase.com>",
        to: email,
        subject: `Your Sonkase Experience — ${packageName} on ${fmtDate(eventDate)}`,
        html,
      });
      return Response.json({ success: true });
    }

    // ── Date Night receipt ────────────────────────────────────────
    if (serviceType === "datenight") {
      const html =
        `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
        LOGO +
        `<div style="background:#E8C97E;padding:13px;text-align:center;">` +
        `<div style="font-size:11px;color:#0c0c0c;letter-spacing:0.4em;text-transform:uppercase;font-weight:bold;">Evening Reserved</div>` +
        `</div>` +
        `<div style="padding:36px 32px;">` +
        `<p style="font-size:16px;color:#1a1208;font-style:italic;margin:0 0 28px;line-height:1.65;">Your evening is confirmed. Come hungry — your chef will take care of everything else.</p>` +
        `<div style="background:#fff;border:1px solid rgba(184,137,42,0.25);padding:20px 24px;margin-bottom:24px;">` +
        row("Confirmation", confirmationId) +
        row("Package", "Date Night Omakase · Two guests") +
        row("Evening", fmtDate(eventDate)) +
        row("Appetizer", appetizerChoice || "—") +
        row("Total", fmt2(total)) +
        row("Deposit Charged", fmt2(deposit)) +
        row("Balance Due", `$${(Number(total) - Number(deposit)).toFixed(2)} — due at the event`) +
        `</div>` +
        (chefNotes
          ? `<div style="background:#fff;border:1px solid rgba(184,137,42,0.25);padding:16px 24px;margin-bottom:24px;">` +
            `<div style="font-size:10px;color:#b8892a;letter-spacing:0.22em;text-transform:uppercase;margin-bottom:8px;">Your Notes to the Chef</div>` +
            `<div style="font-size:14px;color:#5a4f3c;font-style:italic;">${chefNotes}</div>` +
            `</div>` : "") +
        `<div style="padding:18px 22px;background:rgba(184,137,42,0.07);border-left:2px solid #E8C97E;">` +
        `<div style="font-size:10px;color:#b8892a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:10px;">Your Evening</div>` +
        `<ul style="font-size:14px;color:#5a4f3c;line-height:1.9;margin:0;padding-left:18px;font-style:italic;">` +
        `<li>Your chef will prepare five rolls based on what is freshest that evening</li>` +
        `<li>Nine-piece nigiri course included</li>` +
        `<li>Your selected appetizer will open the meal</li>` +
        `<li>Balance due at the event — cash or card accepted</li>` +
        `</ul></div></div>` +
        FOOTER + `</div>`;

      await resend.emails.send({
        from: "Sonkase <bookings@sonkase.com>",
        to: email,
        subject: `Your Sonkase Date Night — ${fmtDate(eventDate)}`,
        html,
      });
      return Response.json({ success: true });
    }

    // ── General booking receipt (legacy flows) ────────────────────
    const appetizersHtml = Array.isArray(appetizers) && appetizers.length > 0
      ? `<div style="margin-bottom:24px;">` +
        `<div style="font-size:10px;color:#b8892a;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:10px;">Appetizers</div>` +
        `<div style="display:flex;flex-direction:column;gap:6px;">` +
        appetizers.flatMap((a) => {
          const lines = [];
          if (a.included_qty > 0) lines.push(`<div style="font-size:14px;color:#2d4a3a;font-family:Georgia,serif;">${a.name} × ${a.included_qty} <span style="font-size:12px;font-style:italic;">(included)</span></div>`);
          if (a.extra_qty > 0)    lines.push(`<div style="font-size:14px;color:#1a1208;font-family:Georgia,serif;">${a.name} × ${a.extra_qty}</div>`);
          return lines;
        }).join("") +
        `</div></div>` : "";

    const html =
      `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
      LOGO +
      `<div style="background:#E8C97E;padding:13px;text-align:center;">` +
      `<div style="font-size:11px;color:#0c0c0c;letter-spacing:0.4em;text-transform:uppercase;font-weight:bold;">Booking Confirmed</div>` +
      `</div>` +
      `<div style="padding:36px 32px;">` +
      `<p style="font-size:16px;color:#1a1208;font-style:italic;margin:0 0 28px;line-height:1.65;">Your Sonkase experience is on the calendar. Here are your details.</p>` +
      `<div style="background:#fff;border:1px solid rgba(184,137,42,0.25);padding:20px 24px;margin-bottom:24px;">` +
      row("Confirmation", confirmationId) +
      row("Package", packageName) +
      row("Event Date", fmtDate(eventDate)) +
      row("Guests", guestCount ? `${guestCount} guests` : "—") +
      row("Total", fmt2(total)) +
      (promoCode && discountAmount ? row(`Promo (${promoCode})`, `−${fmt2(discountAmount)}`) : "") +
      row("Deposit Charged", fmt2(deposit)) +
      row("Balance Due", `$${(Number(total) - Number(deposit)).toFixed(2)} — due at the event`) +
      `</div>` +
      appetizersHtml +
      `<div style="padding:18px 22px;background:rgba(184,137,42,0.07);border-left:2px solid #E8C97E;">` +
      `<div style="font-size:10px;color:#b8892a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:10px;">What Happens Next</div>` +
      `<ul style="font-size:14px;color:#5a4f3c;line-height:1.9;margin:0;padding-left:18px;font-style:italic;">` +
      `<li>Your chef will review your notes before the event</li>` +
      `<li>Balance is due at the event — cash or card accepted</li>` +
      `</ul></div></div>` +
      FOOTER + `</div>`;

    await resend.emails.send({
      from: "Sonkase <bookings@sonkase.com>",
      to: email,
      subject: `Booking Confirmed · ${confirmationId} · Sonkase`,
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Receipt email error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
