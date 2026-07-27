"use client";
// Customer accounts were retired in favor of guest checkout. Anyone who
// previously used /profile is redirected to the booking lookup page, which
// covers the same needs (view a booking, request cancellation) with the
// confirmation number + email from the receipt. Supabase auth accounts
// still exist and are untouched; nothing here deletes or blocks them.
import { useEffect } from "react";

export default function ProfileRedirect() {
  useEffect(() => {
    window.location.replace("/lookup");
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "rgba(245,240,232,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 15, letterSpacing: "0.08em" }}>
      Redirecting to booking lookup…
    </div>
  );
}
