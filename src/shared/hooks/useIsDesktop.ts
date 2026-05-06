import { useEffect, useState } from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

export function useIsDesktop() {
  const getMatches = () => {
    if (typeof window === "undefined") return false;

    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  };

  const [isDesktop, setIsDesktop] = useState(getMatches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateMatches = () => setIsDesktop(mediaQueryList.matches);

    updateMatches();
    mediaQueryList.addEventListener("change", updateMatches);

    return () => {
      mediaQueryList.removeEventListener("change", updateMatches);
    };
  }, []);

  return isDesktop;
}
