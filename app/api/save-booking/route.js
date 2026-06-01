// Supabase SQL migration (run once in Supabase SQL editor):
// alter table bookings add column if not exists platters_ordered jsonb;
// alter table bookings add column if not exists delivery_address text;
// alter table bookings add column if not exists upcharge_total numeric;
// alter table bookings add column if not exists promo_code text;
// alter table bookings add column if not exists discount_amount numeric;
// alter table bookings add column if not exists appetizer_choice text;
// alter table bookings add column if not exists event_time text;
// alter table bookings add column if not exists appetizers_selected jsonb;

import { createClient } from "@supabase/supabase-js";

const CORE_FIELDS = ["user_email", "package", "service_type", "event_date", "guest_count", "status", "delivery_address"];

export async function POST(req) {
  try {
    const booking = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select()
      .single();

    if (!error) {
      return Response.json({ success: true, booking: data });
    }

    // Column doesn't exist yet — retry with only core fields so the booking never fails
    console.error("Full booking save failed, retrying with core fields:", error.message);

    const core = Object.fromEntries(
      CORE_FIELDS.filter((k) => booking[k] !== undefined).map((k) => [k, booking[k]])
    );

    const { data: coreData, error: coreError } = await supabase
      .from("bookings")
      .insert(core)
      .select()
      .single();

    if (coreError) {
      console.error("Core booking save also failed:", coreError);
      return Response.json({ error: coreError.message }, { status: 500 });
    }

    return Response.json({ success: true, booking: coreData });
  } catch (err) {
    console.error("Save booking route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
