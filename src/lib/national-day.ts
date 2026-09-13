"use client";

import { useEffect, useState } from "react";

/**
 * Saudi National Day (September 23) theme detection.
 *
 * Automatically active on September 23 (client-side date check, since the
 * server always renders the default theme to avoid hydration mismatches).
 *
 * For demos or previewing the theme with a client before the actual date,
 * it can be forced on/off via a URL query param:
 *   ?theme=national-day  -> force ON
 *   ?theme=default       -> force OFF (overrides the real date too)
 */
function computeIsNationalDay(): boolean {
  if (typeof window !== "undefined") {
    const override = new URLSearchParams(window.location.search).get("theme");
    if (override === "national-day") return true;
    if (override === "default") return false;
  }
  const now = new Date();
  // Active on September 23 (National Day) and the following day.
  return now.getMonth() === 8 && (now.getDate() === 23 || now.getDate() === 24);
}

export function useNationalDayTheme(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(computeIsNationalDay());
  }, []);

  return active;
}
