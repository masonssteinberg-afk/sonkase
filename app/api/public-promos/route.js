import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_type, discount_value")
      .eq("active", true)
      .is("max_uses", null);

    if (error) throw error;

    return Response.json({ promos: data || [] });
  } catch (err) {
    console.error("public-promos error:", err.message);
    return Response.json({ promos: [] });
  }
}
