// SQL — run once in Supabase SQL editor before using this feature:
//
// create table if not exists promo_codes (
//   id uuid default gen_random_uuid() primary key,
//   code text unique not null,
//   discount_type text not null check (discount_type in ('percent', 'flat')),
//   discount_value numeric not null,
//   active boolean default true,
//   expires_at date,
//   max_uses integer,
//   uses_count integer default 0,
//   description text,
//   created_at timestamptz default now()
// );
//
// alter table bookings add column if not exists promo_code text;
// alter table bookings add column if not exists discount_amount numeric;

import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { code, subtotal } = await req.json();
    if (!code) return Response.json({ valid: false, error: "No code provided" });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !data) return Response.json({ valid: false, error: "Invalid promo code" });
    if (!data.active) return Response.json({ valid: false, error: "This code is no longer active" });
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return Response.json({ valid: false, error: "This code has expired" });
    }
    if (data.max_uses != null && data.uses_count >= data.max_uses) {
      return Response.json({ valid: false, error: "This code has reached its usage limit" });
    }

    const sub = Number(subtotal) || 0;
    const discount_amount = data.discount_type === "percent"
      ? Math.round((sub * data.discount_value / 100) * 100) / 100
      : Math.min(Number(data.discount_value), sub);
    const new_total = Math.max(0, sub - discount_amount);

    return Response.json({
      valid: true,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      discount_amount,
      new_total,
    });
  } catch (err) {
    console.error("validate-promo error:", err.message);
    return Response.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
