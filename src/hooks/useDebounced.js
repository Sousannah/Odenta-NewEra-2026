import { useEffect, useState } from "react";

/**
 * A value that settles before anything reads it.
 *
 * Every search box on the desk's screens is wired to a server query. Without
 * this, typing "Mariam" is six queries and five wasted ones — which on the
 * clinic's data store is six charges, not six milliseconds. The desk types all
 * day, so this is one of the larger savings in the portal for one line at each
 * call site.
 *
 *   const search = useDebounced(query);          // 300ms
 *   useAsync(() => getCases({ q: search }), [search]);
 */
export function useDebounced(value, delay = 300) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    /* An empty box is a reset, not a search — clearing should feel instant. */
    if (!value) {
      setSettled(value);
      return undefined;
    }
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
