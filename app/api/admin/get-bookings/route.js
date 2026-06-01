import { createClient } from "@supabase/supabase-js";

export async function GET() {
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

    return Response.json({ bookings: data || [] });
  } catch (err) {
    console.error("get-bookings route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
