"use client";

import { useEffect } from "react";
import { useNationalDayTheme } from "@/lib/national-day";

/**
 * Saudi National Day (September 23) theme activator.
 *
 * Toggles the `data-theme="national-day"` attribute on the root <html>
 * element based on `useNationalDayTheme`. The attribute is only ever set
 * inside `useEffect`, so the server render is identical to the client
 * render by default — there is no hydration mismatch. See
 * `src/lib/national-day.ts` for the date logic and the `?theme=` preview
 * override used to demo this to a client without waiting for the date.
 */
export default function NationalDayTheme() {
  const active = useNationalDayTheme();

  useEffect(() => {
    if (active) {
      document.documentElement.setAttribute("data-theme", "national-day");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [active]);

  return null;
}
