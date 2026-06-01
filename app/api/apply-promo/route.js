import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (!code) return Response.json({ success: false });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const normalizedCode = code.toUpperCase().trim();

    const { data: curr } = await supabase
      .from("promo_codes")
      .select("uses_count")
      .eq("code", normalizedCode)
      .single();

    if (!curr) return Response.json({ success: false });

    await supabase
      .from("promo_codes")
      .update({ uses_count: (curr.uses_count || 0) + 1 })
      .eq("code", normalizedCode);

    return Response.json({ success: true });
  } catch (err) {
    console.error("apply-promo error:", err.message);
    return Response.json({ success: false }, { status: 500 });
  }
}
