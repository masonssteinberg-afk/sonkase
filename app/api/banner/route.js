// SQL — run once in Supabase SQL editor before using this feature:
//
// create table if not exists site_settings (
//   key text primary key,
//   value text,
//   updated_at timestamptz default now()
// );
//
// insert into site_settings (key, value) values ('banner_enabled', 'false') on conflict (key) do nothing;
// insert into site_settings (key, value) values ('banner_text', '') on conflict (key) do nothing;

import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["banner_enabled", "banner_text"]);

    if (error) throw error;

    const map = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });

    return Response.json({
      enabled: map.banner_enabled === "true",
      text: map.banner_text || "",
    });
  } catch {
    return Response.json({ enabled: false, text: "" });
  }
}
