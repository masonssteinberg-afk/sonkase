import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET — returns the promo code currently designated as the site markdown promo
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("site_settings")
      .select("value")
      .eq("key", "markdown_promo_code")
      .maybeSingle();
    if (error) throw error;
    return Response.json({ code: data?.value || "" });
  } catch (err) {
    console.error("markdown-promo GET error:", err.message);
    return Response.json({ code: "" });
  }
}

// POST { code } — designate a promo as the site markdown promo ("" clears it)
export async function POST(req) {
  try {
    const { code } = await req.json();
    const { error } = await getSupabase().from("site_settings").upsert(
      { key: "markdown_promo_code", value: (code || "").toUpperCase().trim(), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    console.error("markdown-promo POST error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
