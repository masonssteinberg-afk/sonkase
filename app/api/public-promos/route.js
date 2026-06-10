import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const today = new Date().toISOString().split("T")[0];

    // If the admin has designated a markdown promo, show exactly that one
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "markdown_promo_code")
      .maybeSingle();

    if (setting?.value) {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_type, discount_value, expires_at")
        .eq("code", setting.value)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      const valid = data && (!data.expires_at || data.expires_at >= today);
      return Response.json({
        promos: valid
          ? [{ code: data.code, discount_type: data.discount_type, discount_value: data.discount_value }]
          : [],
      });
    }

    // Fallback: no designated promo — previous behavior (active, unlimited-use codes)
    const { data, error } = await supabase
      .from("promo_codes")
      .select("code, discount_type, discount_value, expires_at")
      .eq("active", true)
      .is("max_uses", null);

    if (error) throw error;

    const promos = (data || [])
      .filter((p) => !p.expires_at || p.expires_at >= today)
      .map(({ code, discount_type, discount_value }) => ({ code, discount_type, discount_value }));

    return Response.json({ promos });
  } catch (err) {
    console.error("public-promos error:", err.message);
    return Response.json({ promos: [] });
  }
}
