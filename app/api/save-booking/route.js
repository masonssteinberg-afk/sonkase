// Supabase SQL migration (run once in Supabase SQL editor):
// alter table bookings add column if not exists platters_ordered jsonb;
// alter table bookings add column if not exists delivery_address text;
// alter table bookings add column if not exists upcharge_total numeric;
// alter table bookings add column if not exists promo_code text;
// alter table bookings add column if not exists discount_amount numeric;
// alter table bookings add column if not exists appetizer_choice text;
// alter table bookings add column if not exists event_time text;
// alter table bookings add column if not exists appetizers_selected jsonb;
// alter table bookings add column if not exists price_per_guest numeric;

import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const booking = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

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

    return Response.json({ success: true, booking: data });
  } catch (err) {
    console.error("Save booking route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
