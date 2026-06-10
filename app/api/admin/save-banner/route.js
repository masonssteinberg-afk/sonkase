import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { enabled, text } = await req.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("site_settings").upsert([
      { key: "banner_enabled", value: String(!!enabled), updated_at: new Date().toISOString() },
      { key: "banner_text",    value: text || "",          updated_at: new Date().toISOString() },
    ], { onConflict: "key" });

    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error("save-banner error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
