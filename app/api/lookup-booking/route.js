// Guest booking lookup: requires BOTH the confirmation number and the
// email the booking was made with. Returns a display-safe subset only.
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { confirmation, email } = await req.json();
    const conf = String(confirmation || "").trim().toUpperCase().replace(/^#/, "");
    const mail = String(email || "").trim().toLowerCase();
    if (!conf || !mail.includes("@")) {
      return Response.json({ error: "Enter your confirmation number and email." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("bookings")
      .select("id, confirmation_number, package, board_type, service_type, event_date, event_time, guest_count, price_per_guest, total_price, base_rate, addons_total, subtotal, deposit_amount, discount_amount, promo_code, status, special_requests, delivery_address, contact_name, user_email, created_at")
      .eq("confirmation_number", conf)
      .ilike("user_email", mail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("lookup error:", error.message);
      return Response.json({ error: "Lookup failed. Please try again." }, { status: 500 });
    }
    if (!data) {
      return Response.json({ error: "No booking matches that confirmation number and email." }, { status: 404 });
    }

    // The chosen order, for the on-page menu recap. Non-fatal — a booking
    // still shows even if the selection tables are unavailable.
    try {
      const [sels, adds] = await Promise.all([
        supabase.from("booking_selections").select("item_type, item_id, name_snapshot").eq("booking_id", data.id),
        supabase.from("booking_addons").select("addon_id, unit_price_snapshot, quantity").eq("booking_id", data.id),
      ]);
      data.selections = sels.data || [];
      data.addons = adds.data || [];
    } catch (e) {
      data.selections = [];
      data.addons = [];
    }

    return Response.json({ booking: data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
