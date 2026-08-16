// Guest self-serve roll selection: a guest who can prove ownership of a
// booking (confirmation number + booking email) sets or changes the rolls on
// their order. Selections lock 72 hours before the event. Nigiri rows, if any,
// are left untouched; only the 'roll' rows are replaced.
import { createClient } from "@supabase/supabase-js";
import { rollById, ROLL_ALLOWANCE } from "@/lib/pricing";

// Hours before the event after which the roll list is frozen.
const LOCK_HOURS = 72;

export async function POST(req) {
  try {
    const { confirmation, email, rolls } = await req.json();
    const conf = String(confirmation || "").trim().toUpperCase().replace(/^#/, "");
    const mail = String(email || "").trim().toLowerCase();

    if (!conf || !mail.includes("@")) {
      return Response.json({ error: "Enter your confirmation number and email." }, { status: 400 });
    }
    if (!Array.isArray(rolls)) {
      return Response.json({ error: "No rolls provided." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Ownership check — both the confirmation number and the booking email
    // must match, exactly as the lookup flow requires.
    const { data: booking, error: findErr } = await supabase
      .from("bookings")
      .select("id, board_type, event_date, event_time, status")
      .eq("confirmation_number", conf)
      .ilike("user_email", mail)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("update-selections lookup error:", findErr.message);
      return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
    if (!booking) {
      return Response.json({ error: "No booking matches that confirmation number and email." }, { status: 404 });
    }

    // 72-hour lock — no changes once the fish order is placed.
    if (isLocked(booking.event_date, booking.event_time)) {
      return Response.json(
        { error: `Roll selections lock ${LOCK_HOURS} hours before the event. Contact us to make a change.` },
        { status: 409 }
      );
    }

    // Validate the picks: known, available rolls, no duplicates, within the
    // board's allowance.
    const allowance = ROLL_ALLOWANCE(booking.board_type);
    if (!allowance) {
      return Response.json({ error: "This booking does not support roll selection." }, { status: 400 });
    }

    const seen = new Set();
    const cleaned = [];
    for (const raw of rolls) {
      const id = String(raw);
      if (seen.has(id)) continue;
      const roll = rollById(id);
      if (!roll || !roll.available) {
        return Response.json({ error: `"${id}" is not an available roll.` }, { status: 400 });
      }
      seen.add(id);
      cleaned.push({ id, name: roll.name });
    }
    if (cleaned.length > allowance) {
      return Response.json({ error: `Choose at most ${allowance} rolls for this board.` }, { status: 400 });
    }

    // Replace only the roll rows: clear the old ones, insert the new list.
    const { error: delErr } = await supabase
      .from("booking_selections")
      .delete()
      .eq("booking_id", booking.id)
      .eq("item_type", "roll");
    if (delErr) {
      console.error("update-selections delete error:", delErr.message);
      return Response.json({ error: "Could not save your rolls. Please try again." }, { status: 500 });
    }

    if (cleaned.length) {
      const rows = cleaned.map((r) => ({
        booking_id: booking.id,
        item_type: "roll",
        item_id: r.id,
        name_snapshot: r.name,
      }));
      const { error: insErr } = await supabase.from("booking_selections").insert(rows);
      if (insErr) {
        console.error("update-selections insert error:", insErr.message);
        return Response.json({ error: "Could not save your rolls. Please try again." }, { status: 500 });
      }
    }

    return Response.json({
      success: true,
      rolls: cleaned.map((r) => ({ item_type: "roll", item_id: r.id, name_snapshot: r.name })),
    });
  } catch (err) {
    console.error("update-selections route error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// True once we are within LOCK_HOURS of the event (or past it). Event time is
// optional; without it the whole event day is treated as the deadline.
function isLocked(eventDate, eventTime) {
  if (!eventDate) return false;
  const time = /^\d{1,2}:\d{2}/.test(eventTime || "") ? eventTime : "00:00";
  const event = new Date(`${eventDate}T${time}:00`);
  if (Number.isNaN(event.getTime())) return false;
  const lockAt = event.getTime() - LOCK_HOURS * 3600 * 1000;
  return Date.now() >= lockAt;
}
