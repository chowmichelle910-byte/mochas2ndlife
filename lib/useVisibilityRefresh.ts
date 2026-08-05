import { useEffect, useState } from "react";

const DEFAULT_POLL_INTERVAL_MS = 30000;

/**
 * Returns a counter that increments whenever the app becomes visible again
 * (tab/window refocused, or restored from iOS PWA suspend / bfcache), and
 * also on a fixed interval while visible — so data someone else added from
 * another device shows up without needing to background/foreground the app
 * at all. Add it to a data-fetching effect's dependency array to refetch
 * without touching any other component state (current route, selected date,
 * report range, etc.).
 *
 * Pass pollIntervalMs=0 to disable the interval and only refetch on resume.
 */
export function useVisibilityRefresh(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS): number {
  const [key, setKey] = useState(0);

  useEffect(() => {
    function bump() {
      setKey((k) => k + 1);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") bump();
    }
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) bump();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", bump);
    window.addEventListener("pageshow", handlePageShow);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") bump();
      }, pollIntervalMs);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", bump);
      window.removeEventListener("pageshow", handlePageShow);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollIntervalMs]);

  return key;
}
