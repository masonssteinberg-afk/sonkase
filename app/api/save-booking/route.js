// Supabase SQL migration — run supabase/migrations/0001_menu_selections_and_addons.sql
// (adds board_type, base_rate, addons_total, subtotal, deposit_amount to
// bookings and creates booking_selections + booking_addons). Earlier columns
// this route relies on:
// alter table bookings add column if not exists platters_ordered jsonb;
// alter table bookings add column if not exists delivery_address text;
// alter table bookings add column if not exists upcharge_total numeric;
// alter table bookings add column if not exists promo_code text;
// alter table bookings add column if not exists discount_amount numeric;
// alter table bookings add column if not exists appetizer_choice text;
// alter table bookings add column if not exists event_time text;
// alter table bookings add column if not exists appetizers_selected jsonb;
// alter table bookings add column if not exists price_per_guest numeric;
// alter table bookings add column if not exists contact_name text;
// alter table bookings add column if not exists contact_phone text;

import { createClient } from "@supabase/supabase-js";
import { bookingCharge, rollById, addonById, effectiveAddonPrice } from "@/lib/pricing";

export async function POST(req) {
  try {
    const payload = await req.json();
    // Selections / add-ons go to their own tables, not onto the bookings row.
    const { selections = [], addons = [], ...booking } = payload;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // ── Recompute every total server-side from lib/pricing ──────────────
    // Never trust a total posted from the client. When board_type is present
    // (the /book flow), the money is rebuilt here and the client's numbers are
    // ignored. Legacy callers without a board_type pass through unchanged.
    const addonIds = Array.isArray(addons) ? addons.map((a) => a && a.addon_id).filter(Boolean) : [];
    if (booking.board_type != null) {
      const charge = bookingCharge(
        booking.board_type,
        booking.guest_count,
        addonIds,
        Number(booking.discount_amount) || 0
      );
      if (!charge) {
        return Response.json(
          { error: `Invalid board or guest count (${booking.board_type}, ${booking.guest_count})` },
          { status: 400 }
        );
      }
      booking.board_type    = charge.boardId;
      booking.guest_count   = charge.guests;
      booking.base_rate     = charge.baseTotal;
      booking.addons_total  = charge.addonsTotal;
      booking.subtotal      = charge.subtotal;
      booking.total_price   = charge.subtotal;   // keep total_price in sync for existing surfaces
      booking.deposit_amount = charge.deposit;
      if (Number(booking.discount_amount) > 0) booking.discount_amount = charge.discount;
    }

    // No partial-save fallback: if the insert fails (e.g. a missing column),
    // fail loudly rather than silently storing a booking with no price,
    // deposit, or confirmation number. The client surfaces the error and
    // tells the guest their payment went through.
    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select()
      .single();

    if (error) {
      console.error("Booking save failed:", error.message, "payload keys:", Object.keys(booking).join(","));
      return Response.json({ error: error.message }, { status: 500 });
    }

    // ── Selections & add-ons — names/prices snapshotted at write time ───
    // Non-fatal: a paid booking must never be lost over a child-table hiccup;
    // any failure is logged and the booking still succeeds.
    try {
      const selRows = (Array.isArray(selections) ? selections : [])
        .filter((s) => s && (s.item_type === "roll" || s.item_type === "nigiri") && s.item_id != null)
        .map((s) => {
          const item_id = String(s.item_id);
          return {
            booking_id: data.id,
            item_type: s.item_type,
            item_id,
            name_snapshot: s.item_type === "roll" ? (rollById(item_id)?.name ?? item_id) : item_id,
          };
        });
      if (selRows.length) {
        const { error: selErr } = await supabase.from("booking_selections").insert(selRows);
        if (selErr) console.error("booking_selections insert failed:", selErr.message);
      }

      const addonRows = addonIds
        .map((id) => {
          const a = addonById(id);
          if (!a) return null;
          return {
            booking_id: data.id,
            addon_id: id,
            unit_price_snapshot: effectiveAddonPrice(a),
            quantity: Number(booking.guest_count) || 0,
          };
        })
        .filter(Boolean);
      if (addonRows.length) {
        const { error: addErr } = await supabase.from("booking_addons").insert(addonRows);
        if (addErr) console.error("booking_addons insert failed:", addErr.message);
      }
    } catch (childErr) {
      console.error("selection/addon capture failed:", childErr.message);
    }

    // Capture the booker on the marketing list (source: booking).
    // Non-fatal: a subscriber hiccup never affects the booking.
    if (booking.user_email) {
      const { error: subError } = await supabase
        .from("subscribers")
        .insert({ email: String(booking.user_email).toLowerCase(), source: "booking" });
      if (subError && subError.code !== "23505") {
        console.error("subscriber capture failed:", subError.message);
      }
    }

    return Response.json({ success: true, booking: data });
  } catch (err) {
    console.error("Save booking route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
