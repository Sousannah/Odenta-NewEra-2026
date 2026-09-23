import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query from React.
 *
 * The portal shells need this for one thing Tailwind cannot express on its
 * own: the sidebar is a *rail* on a desktop and a *drawer* on a phone, and the
 * two want different markup, not different classes. A collapsed rail hides its
 * labels; a drawer never should, however the rail was left.
 *
 * Reads synchronously on first render so the shell does not flash the wrong
 * shape, and falls back to the desktop layout where `matchMedia` is missing
 * (server rendering, very old browsers) — the same choice the CSS makes.
 */
export function useMediaQuery(query) {
  const read = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(read);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;

    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);

    setMatches(list.matches);

    /* Safari below 14 only has the deprecated pair. */
    if (list.addEventListener) {
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    }
    list.addListener(onChange);
    return () => list.removeListener(onChange);
  }, [query]);

  return matches;
}

/** The Tailwind `lg` breakpoint — where both shells switch rail ↔ drawer. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
