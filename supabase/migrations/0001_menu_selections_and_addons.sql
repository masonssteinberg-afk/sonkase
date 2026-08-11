-- ─────────────────────────────────────────────────────────────────────
-- Sonakase — roll/nigiri selection + sashimi add-on
--
-- Run ONCE in the Supabase SQL editor BEFORE deploying the booking-flow
-- changes. The /api/save-booking route fails loudly on a missing column,
-- so the new columns must exist first or new bookings will not save.
--
-- Idempotent: safe to re-run. The FK columns auto-match bookings.id's type
-- (bigint or uuid), so there is nothing to tweak by hand.
-- ─────────────────────────────────────────────────────────────────────

-- 1) bookings: money breakdown + the chosen board -----------------------
--    board_type    'full' | 'short'
--    base_rate     board sushi & service (incl. second-chef fee), before
--                  any promo discount or add-ons
--    addons_total  sum of add-on charges (e.g. sashimi)
--    subtotal      grand total actually charged (base − discount + add-ons);
--                  kept equal to total_price for the existing surfaces
--    deposit_amount  flat deposit (may already exist from earlier flows)
alter table bookings add column if not exists board_type     text;
alter table bookings add column if not exists base_rate      numeric;
alter table bookings add column if not exists addons_total    numeric;
alter table bookings add column if not exists subtotal        numeric;
alter table bookings add column if not exists deposit_amount  numeric;

-- 2) booking_selections: one row per chosen roll or nigiri --------------
--    Names are snapshotted at write time so a later menu rename never
--    rewrites a past order.
do $$
declare id_type text;
begin
  select data_type into id_type
    from information_schema.columns
   where table_name = 'bookings' and column_name = 'id';
  if id_type is null then
    raise exception 'bookings.id not found — run this in the project that owns the bookings table';
  end if;

  execute format($f$
    create table if not exists booking_selections (
      id            bigint generated always as identity primary key,
      booking_id    %s not null references bookings(id) on delete cascade,
      item_type     text not null check (item_type in ('roll','nigiri')),
      item_id       text not null,
      name_snapshot text not null,
      created_at    timestamptz not null default now()
    )
  $f$, id_type);

  execute format($f$
    create table if not exists booking_addons (
      id                  bigint generated always as identity primary key,
      booking_id          %s not null references bookings(id) on delete cascade,
      addon_id            text not null,
      unit_price_snapshot numeric not null,
      quantity            integer not null,
      created_at          timestamptz not null default now()
    )
  $f$, id_type);
end $$;

create index if not exists booking_selections_booking_id_idx on booking_selections (booking_id);
create index if not exists booking_addons_booking_id_idx     on booking_addons (booking_id);

-- 3) Row-level security -------------------------------------------------
--    Writes and reads happen through the service-role key (save-booking,
--    lookup-booking, admin), which bypasses RLS. Enable RLS with no public
--    policy so the anon key cannot read guests' orders directly.
alter table booking_selections enable row level security;
alter table booking_addons     enable row level security;
