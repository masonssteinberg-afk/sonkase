// Supabase SQL migration (run once in Supabase SQL editor):
// create table if not exists subscribers (
//   id uuid primary key default gen_random_uuid(),
//   email text not null unique,
//   source text,
//   unsubscribed boolean not null default false,
//   created_at timestamptz not null default now()
// );
// alter table subscribers enable row level security;

import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const { email, source } = await req.json();
    const clean = String(email || "").trim().toLowerCase();
    if (!clean.includes("@") || clean.length < 5 || clean.length > 320) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from("subscribers")
      .insert({ email: clean, source: String(source || "site").slice(0, 40) });

    // Duplicate emails succeed silently — same success state either way.
    if (error && error.code !== "23505") {
      console.error("subscribe error:", error.message);
      return Response.json({ error: "Could not subscribe" }, { status: 500 });
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
