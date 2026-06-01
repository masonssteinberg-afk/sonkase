export async function POST(req) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();
    const {
      type, clientEmail, confirmationId, packageName, eventDate,
      guestCount, total, deposit, rolls, appetizers, specialRequests,
      plattersOrdered, deliveryAddress, upchargeTotal,
      bookingId, appetizerChoice, chefNotes, eventTime, appetizersSelected,
    } = body;

    // ── Cancellation request ─────────────────────────────────────
    if (type === "cancellation_request") {
      const fmtDate2 = (d) => {
        if (!d) return "—";
        const [y, m, day] = d.split("-");
        return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
      };
      const html =
        `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
        `<div style="background:#0c0c0c;padding:20px 32px;text-align:center;"><img src="https://chefsspecialsushi.com/sonakase-logo.svg" alt="Sonakase" width="200" height="58" style="display:block;margin:0 auto;max-width:100%;border:0;" /></div>` +
        `<div style="background:#E8C97E;padding:10px;text-align:center;"><div style="font-size:10px;color:#0c0c0c;letter-spacing:0.35em;text-transform:uppercase;font-weight:bold;">Cancellation Request</div></div>` +
        `<div style="padding:32px 36px;">` +
        `<div style="background:#fff;border:1px solid rgba(26,18,8,0.1);padding:20px 24px;margin-bottom:20px;">` +
        `<table style="width:100%;border-collapse:collapse;">` +
        `<tr><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:10px;color:#a07736;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;padding-right:24px;">Client</td><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:14px;color:#1a1208;font-family:Georgia,serif;">${clientEmail ?? "—"}</td></tr>` +
        `<tr><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:10px;color:#a07736;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;padding-right:24px;">Confirmation</td><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:14px;color:#1a1208;font-family:Georgia,serif;">${confirmationId ?? "—"}</td></tr>` +
        `<tr><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:10px;color:#a07736;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;padding-right:24px;">Event Date</td><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:14px;color:#1a1208;font-family:Georgia,serif;">${fmtDate2(eventDate)}</td></tr>` +
        `<tr><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:10px;color:#a07736;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;padding-right:24px;">Package</td><td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:14px;color:#1a1208;font-family:Georgia,serif;">${packageName ?? "—"}</td></tr>` +
        `</table>` +
        `</div>` +
        `<div style="padding:14px 16px;background:rgba(197,85,45,0.06);border-left:3px solid #c5552d;margin-bottom:20px;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Action Required</div>` +
        `<div style="font-size:14px;color:#5a4f3c;font-family:Georgia,serif;">This client is requesting cancellation. They qualify for a full refund (72+ hours before event). Please process and confirm.</div>` +
        `</div>` +
        `<div style="text-align:center;"><a href="https://chefsspecialsushi.com/admin" style="display:inline-block;background:#c5552d;color:#f5ecd9;padding:14px 28px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-family:Georgia,serif;">View in Admin Dashboard →</a></div>` +
        `</div>` +
        `<div style="background:#0c0c0c;padding:16px;text-align:center;"><p style="font-size:10px;color:rgba(245,240,232,0.25);letter-spacing:0.15em;margin:0;">sonakase · chefsspecialsushi.com</p></div>` +
        `</div>`;
      await resend.emails.send({
        from: "Sonakase <bookings@sonakase.com>",
        to: "masonssteinberg@gmail.com",
        subject: `Cancellation Request — ${clientEmail}`,
        html,
      });
      return Response.json({ success: true });
    }

    const fmt2 = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");

    const fmtDate = (d) => {
      if (!d) return "—";
      const [y, m, day] = d.split("-");
      return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    };

    const row = (label, value) =>
      `<tr>` +
      `<td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:10px;color:#a07736;letter-spacing:0.18em;text-transform:uppercase;font-weight:bold;white-space:nowrap;padding-right:24px;">${label}</td>` +
      `<td style="padding:9px 0;border-bottom:1px dotted rgba(26,18,8,0.1);font-size:14px;color:#1a1208;font-family:Georgia,serif;">${value ?? "—"}</td>` +
      `</tr>`;

    const rollsHtml = Array.isArray(rolls) && rolls.length > 0
      ? `<div style="margin-top:20px;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">Rolls Selected</div>` +
        `<div style="display:flex;flex-wrap:wrap;gap:6px;">` +
        rolls.map((r) =>
          `<span style="font-size:13px;color:#1a1208;background:#f5ecd9;border:1px solid rgba(26,18,8,0.12);padding:4px 10px;font-family:Georgia,serif;">${r.name} × ${r.qty}</span>`
        ).join("") +
        `</div></div>`
      : "";

    const appetizersHtml = Array.isArray(appetizers) && appetizers.length > 0
      ? `<div style="margin-top:16px;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">Appetizers</div>` +
        `<div style="display:flex;flex-wrap:wrap;gap:6px;">` +
        appetizers.flatMap((a) => {
          const pills = [];
          if (a.included_qty > 0) pills.push(
            `<span style="font-size:13px;color:#2d4a3a;background:#eaf2ec;border:1px solid rgba(45,74,58,0.25);padding:4px 10px;font-family:Georgia,serif;">${a.name} × ${a.included_qty} <em style="font-size:11px;">(included)</em></span>`
          );
          if (a.extra_qty > 0) pills.push(
            `<span style="font-size:13px;color:#1a1208;background:#f5ecd9;border:1px solid rgba(26,18,8,0.12);padding:4px 10px;font-family:Georgia,serif;">${a.name} × ${a.extra_qty}</span>`
          );
          return pills;
        }).join("") +
        `</div></div>`
      : "";

    const specialRequestsHtml = specialRequests
      ? `<div style="margin-top:16px;padding:14px 16px;background:rgba(197,85,45,0.06);border-left:3px solid #c5552d;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Special Requests</div>` +
        `<div style="font-size:14px;color:#5a4f3c;font-style:italic;font-family:Georgia,serif;">${specialRequests}</div>` +
        `</div>`
      : "";

    const plattersHtml = Array.isArray(plattersOrdered) && plattersOrdered.length > 0
      ? `<div style="margin-top:20px;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">Platters Ordered</div>` +
        plattersOrdered.map((po) =>
          `<div style="margin-bottom:12px;padding:12px 14px;background:#fff;border:1px solid rgba(26,18,8,0.1);">` +
          `<div style="font-size:14px;color:#1a1208;font-weight:bold;margin-bottom:4px;">${po.quantity}× ${po.platter_name} — $${(po.base_price * po.quantity).toFixed(0)}</div>` +
          (Array.isArray(po.substitutions) && po.substitutions.length > 0
            ? po.substitutions.map((s) =>
                `<div style="font-size:12px;color:#5a4f3c;font-style:italic;margin-top:3px;">↳ ${s.original_roll} → ${s.replacement_roll}${s.upcharge_per_roll > 0 ? ` (+$${(s.upcharge_per_roll * s.slot_qty).toFixed(0)}/platter)` : ""}</div>`
              ).join("")
            : `<div style="font-size:12px;color:#a89a82;font-style:italic;margin-top:3px;">No substitutions</div>`) +
          `</div>`
        ).join("") +
        (deliveryAddress ? `<div style="font-size:13px;color:#1a1208;margin-top:8px;"><strong>Delivery:</strong> ${deliveryAddress}</div>` : "") +
        (upchargeTotal > 0 ? `<div style="font-size:13px;color:#c5552d;margin-top:6px;"><strong>Upcharge total:</strong> $${Number(upchargeTotal).toFixed(2)}</div>` : "") +
        `</div>`
      : "";

    const isOmakase  = type === "omakase";
    const isDateNight = type === "datenight";
    const isDropoff = !isDateNight && !isOmakase && Array.isArray(plattersOrdered) && plattersOrdered.length > 0;

    if (isOmakase) {
      const fmtTime = (v) => {
        if (!v) return "—";
        const [h, m] = v.split(":").map(Number);
        const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${hour12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
      };
      const appetizersStr = Array.isArray(appetizersSelected) ? appetizersSelected.join(", ") : (appetizersSelected || "—");
      const omHtml =
        `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
        `<div style="background:#0c0c0c;padding:20px 32px;text-align:center;"><img src="https://chefsspecialsushi.com/sonakase-logo.svg" alt="Sonakase" width="200" height="58" style="display:block;margin:0 auto;max-width:100%;border:0;" /></div>` +
        `<div style="background:#E8C97E;padding:10px;text-align:center;"><div style="font-size:10px;color:#0c0c0c;letter-spacing:0.35em;text-transform:uppercase;font-weight:bold;">New Omakase Booking</div></div>` +
        `<div style="padding:32px 36px;">` +
        `<div style="background:#fff;border:1px solid rgba(26,18,8,0.1);padding:20px 24px;margin-bottom:20px;">` +
        `<table style="width:100%;border-collapse:collapse;">` +
        row("Confirmation", confirmationId) +
        row("Client", clientEmail) +
        row("Experience", packageName) +
        row("Date", fmtDate(eventDate)) +
        row("Time", fmtTime(eventTime)) +
        row("Guests", guestCount ? `${guestCount} guests` : "—") +
        row("Appetizer(s)", appetizersStr) +
        row("Total", fmt2(total)) +
        row("Deposit", fmt2(deposit)) +
        row("Balance Due", fmt2(total && deposit ? Number(total) - Number(deposit) : null)) +
        `</table></div>` +
        (chefNotes ? `<div style="margin-bottom:20px;padding:14px 16px;background:rgba(197,85,45,0.06);border-left:3px solid #c5552d;">` +
          `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Guest Restrictions / Chef's Notes</div>` +
          `<div style="font-size:14px;color:#5a4f3c;font-style:italic;">${chefNotes}</div></div>` : "") +
        `<div style="margin-bottom:20px;padding:14px 16px;background:rgba(160,119,54,0.07);border-left:3px solid #a07736;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Chef Note</div>` +
        `<div style="font-size:14px;color:#5a4f3c;">Review their restrictions before the event. Arrive 30 minutes before ${fmtTime(eventTime)} to set up.</div></div>` +
        `<div style="text-align:center;"><a href="https://chefsspecialsushi.com/admin" style="display:inline-block;background:#c5552d;color:#f5ecd9;padding:14px 28px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">View in Admin →</a></div>` +
        `</div>` +
        `<div style="background:#0c0c0c;padding:16px;text-align:center;"><p style="font-size:10px;color:rgba(245,240,232,0.25);letter-spacing:0.15em;margin:0;">sonakase · chefsspecialsushi.com</p></div>` +
        `</div>`;
      await resend.emails.send({
        from: "Sonakase <bookings@sonakase.com>",
        to: "masonssteinberg@gmail.com",
        subject: `New Booking — ${packageName} on ${fmtDate(eventDate)} at ${fmtTime(eventTime)}`,
        html: omHtml,
      });
      return Response.json({ success: true });
    }

    if (isDateNight) {
      const dnHtml =
        `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
        `<div style="background:#0c0c0c;padding:20px 32px;text-align:center;"><img src="https://chefsspecialsushi.com/sonakase-logo.svg" alt="Sonakase" width="200" height="58" style="display:block;margin:0 auto;max-width:100%;border:0;" /></div>` +
        `<div style="background:#E8C97E;padding:10px;text-align:center;"><div style="font-size:10px;color:#0c0c0c;letter-spacing:0.35em;text-transform:uppercase;font-weight:bold;">New Date Night Omakase</div></div>` +
        `<div style="padding:32px 36px;">` +
        `<div style="background:#fff;border:1px solid rgba(26,18,8,0.1);padding:20px 24px;margin-bottom:20px;">` +
        `<table style="width:100%;border-collapse:collapse;">` +
        row("Confirmation", confirmationId) +
        row("Client", clientEmail) +
        row("Evening", fmtDate(eventDate)) +
        row("Appetizer", appetizerChoice || "—") +
        row("Total", fmt2(total)) +
        row("Deposit", fmt2(deposit)) +
        row("Balance Due", fmt2(total && deposit ? Number(total) - Number(deposit) : null)) +
        `</table></div>` +
        (chefNotes ? `<div style="margin-bottom:20px;padding:14px 16px;background:rgba(160,119,54,0.08);border-left:3px solid #a07736;">` +
          `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Guest Restrictions / Notes</div>` +
          `<div style="font-size:14px;color:#5a4f3c;font-style:italic;">${chefNotes}</div></div>` : "") +
        `<div style="margin-bottom:20px;padding:14px 16px;background:rgba(197,85,45,0.06);border-left:3px solid #c5552d;">` +
        `<div style="font-size:10px;color:#a07736;letter-spacing:0.2em;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">Chef Reminder</div>` +
        `<div style="font-size:14px;color:#5a4f3c;">Review their restrictions before the event. Five rolls, chef's choice based on freshest catch. Nine-piece nigiri course included.</div></div>` +
        `<div style="text-align:center;"><a href="https://chefsspecialsushi.com/admin" style="display:inline-block;background:#a07736;color:#f5ecd9;padding:14px 28px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">View in Admin →</a></div>` +
        `</div>` +
        `<div style="background:#0c0c0c;padding:16px;text-align:center;"><p style="font-size:10px;color:rgba(245,240,232,0.25);letter-spacing:0.15em;margin:0;">sonakase · chefsspecialsushi.com</p></div>` +
        `</div>`;
      await resend.emails.send({
        from: "Sonakase <bookings@sonakase.com>",
        to: "masonssteinberg@gmail.com",
        subject: `Date Night Omakase — ${fmtDate(eventDate)} · ${clientEmail}`,
        html: dnHtml,
      });
      return Response.json({ success: true });
    }

    const html =
      `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#F5F0E8;">` +
      `<div style="background:#0c0c0c;padding:20px 32px;text-align:center;"><img src="https://chefsspecialsushi.com/sonakase-logo.svg" alt="Sonakase" width="200" height="58" style="display:block;margin:0 auto;max-width:100%;border:0;" /></div>` +
      `<div style="background:#E8C97E;padding:10px;text-align:center;"><div style="font-size:10px;color:#0c0c0c;letter-spacing:0.35em;text-transform:uppercase;font-weight:bold;">${isDropoff ? "New Drop-Off Order" : "New Booking"}</div></div>` +

      `<div style="padding:32px 36px;">` +

      `<div style="background:#fff;border:1px solid rgba(26,18,8,0.1);padding:20px 24px;margin-bottom:20px;">` +
      `<table style="width:100%;border-collapse:collapse;">` +
      row("Confirmation", confirmationId) +
      row("Client", clientEmail) +
      (isDropoff ? "" : row("Package", packageName)) +
      row("Event Date", fmtDate(eventDate)) +
      (isDropoff ? row("Delivery Address", deliveryAddress || "—") : row("Guests", guestCount ? `${guestCount} guests` : "—")) +
      row("Total", fmt2(total)) +
      row("Deposit", fmt2(deposit)) +
      row("Balance", fmt2(total && deposit ? Number(total) - Number(deposit) : null)) +
      `</table>` +
      `</div>` +

      plattersHtml +
      rollsHtml +
      appetizersHtml +
      specialRequestsHtml +

      `<div style="margin-top:24px;text-align:center;">` +
      `<a href="https://chefsspecialsushi.com/admin" style="display:inline-block;background:#c5552d;color:#f5ecd9;padding:14px 28px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;font-family:Georgia,serif;">` +
      `View in Admin Dashboard →` +
      `</a>` +
      `</div>` +
      `</div>` +

      `<div style="background:#0d1729;padding:16px;text-align:center;">` +
      `<p style="font-size:10px;color:rgba(245,236,217,0.25);letter-spacing:0.15em;margin:0;">chefsspecialsushi.com</p>` +
      `</div>` +
      `</div>`;

    await resend.emails.send({
      from: "Sonakase <bookings@sonakase.com>",
      to: "masonssteinberg@gmail.com",
      subject: isDropoff ? `Drop-Off Order — ${fmtDate(eventDate)}` : `New Booking — ${packageName} on ${fmtDate(eventDate)}`,
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Admin notification error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
