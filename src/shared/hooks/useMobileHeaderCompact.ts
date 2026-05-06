import { useEffect, useState } from "react";

export function useMobileHeaderCompact(threshold = 20) {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const scrollHost = document.querySelector(
      ".MobileAppWrapper main",
    ) as HTMLElement | null;
    const target: Window | HTMLElement = scrollHost ?? window;

    let rafId = 0;
    let ticking = false;

    const getScrollY = () =>
      scrollHost
        ? scrollHost.scrollTop
        : window.scrollY || document.documentElement.scrollTop || 0;

    const syncCompactState = () => {
      const next = getScrollY() > threshold;

      setIsCompact((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      rafId = window.requestAnimationFrame(() => {
        syncCompactState();
        ticking = false;
      });
    };

    syncCompactState();
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [threshold]);

  return isCompact;
}
