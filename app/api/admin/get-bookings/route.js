import { isAdminRequest, adminUnauthorized } from "@/lib/adminAuth";
import { createClient } from "@supabase/supabase-js";

export async function GET(req) {
  if (!isAdminRequest(req)) return adminUnauthorized();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("get-bookings error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const bookings = data || [];

    // Attach each booking's roll/nigiri selections and add-ons for the prep
    // sheet. Non-fatal: bookings still load if the selection tables are absent.
    try {
      const ids = bookings.map((b) => b.id);
      if (ids.length) {
        const [sels, adds] = await Promise.all([
          supabase.from("booking_selections").select("booking_id, item_type, item_id, name_snapshot").in("booking_id", ids),
          supabase.from("booking_addons").select("booking_id, addon_id, unit_price_snapshot, quantity").in("booking_id", ids),
        ]);
        const selBy = {}, addBy = {};
        (sels.data || []).forEach((s) => { (selBy[s.booking_id] ||= []).push(s); });
        (adds.data || []).forEach((a) => { (addBy[a.booking_id] ||= []).push(a); });
        bookings.forEach((b) => { b.selections = selBy[b.id] || []; b.addons = addBy[b.id] || []; });
      }
    } catch (e) {
      console.error("get-bookings selections attach failed:", e.message);
    }

    return Response.json({ bookings });
  } catch (err) {
    console.error("get-bookings route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
