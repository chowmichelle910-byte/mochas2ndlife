import { useEffect, useState } from "react";

/**
 * Returns a counter that increments whenever the app becomes visible again
 * (tab/window refocused, or restored from iOS PWA suspend / bfcache).
 * Add it to a data-fetching effect's dependency array to refetch on resume
 * without touching any other component state (current route, selected date, etc.).
 */
export function useVisibilityRefresh(): number {
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
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", bump);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return key;
}
