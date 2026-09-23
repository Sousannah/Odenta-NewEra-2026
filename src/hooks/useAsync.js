import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The last good answer for a keyed read, so a revisit paints before the network.
 *
 * ## Why this is worth having here
 *
 * Measured against the live database: the API answers in **3.7ms** when it does
 * not touch Cosmos and **382ms** when it does, and a raw round trip to the
 * Cosmos endpoint from here is 580–820ms. The account is in East US 2. So
 * essentially all of the wait is the distance to Virginia, and no amount of
 * code makes a packet faster — the real fix is a read region near the people
 * using it, which is an Azure change and not this one.
 *
 * What code *can* do is stop making somebody look at a spinner for data that
 * has not changed since they saw it ninety seconds ago. A screen with a key
 * renders its last answer immediately and refetches underneath; when the fresh
 * answer lands it replaces what is on screen. Navigating back to a list is
 * then instant, and still correct within one round trip.
 *
 * ## Why entries expire
 *
 * `MAX_AGE_MS` is what keeps "fast" from becoming "wrong". Past it the entry is
 * dropped and the screen waits for the server like it used to — because
 * painting a ten-minute-old recall list without a spinner tells somebody it is
 * current when it is not, and this is a clinical product.
 *
 * The cache is per tab and dies with it. Nothing here is persisted: a reload is
 * a clean read, which is the behaviour anybody debugging expects.
 */
const cache = new Map();

/** A minute. Long enough to cover navigating away and back, short enough that
    nothing on screen is ever meaningfully old. */
const MAX_AGE_MS = 60_000;

/** Bounded so a long session cannot grow it without limit. Oldest out first. */
const MAX_ENTRIES = 120;

function readCache(key) {
  if (!key) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > MAX_AGE_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key, value) {
  if (!key) return;
  /* Re-inserting moves it to the end, so the eviction below is least-recently
     written rather than arbitrary. */
  cache.delete(key);
  cache.set(key, { value, at: Date.now() });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

/**
 * Drop cached reads after a write.
 *
 * Call with no argument to clear everything, or with a prefix to clear one
 * family — `invalidate("recalls")` after marking a recall done. A screen that
 * only calls `refetch()` is already correct, because the refetch overwrites
 * its own entry; this is for the case where writing on one screen makes
 * *another* screen's cache wrong.
 */
export function invalidate(prefix) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Tiny data-fetching hook so screens never touch the service layer's
 * promise plumbing directly.
 *
 *   const { data, loading, error, refetch } = useAsync(
 *     () => clinicService.getPatients({ status }),
 *     [status],
 *     []
 *   );
 */
/**
 * @param options.key  Opt in to stale-while-revalidate. Must identify the read
 *                     uniquely across the whole app — include the filters, e.g.
 *                     `\`recalls:\${status}\``. Omit it and this behaves exactly
 *                     as it always has: spinner, fetch, render.
 */
export function useAsync(factory, deps = [], initial = null, options = {}) {
  const { key = null } = options;

  /**
   * Seeded from the cache on the very first render, not in an effect.
   *
   * Doing it in an effect would paint the spinner for one frame first, which is
   * the flicker this exists to remove.
   */
  const cached = readCache(key);
  const [data, setData] = useState(cached !== undefined ? cached : initial);
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    /**
     * A keyed read with something cached revalidates *quietly*.
     *
     * Setting `loading` here would swap the list for a skeleton on every
     * revisit, which is the flicker this is meant to remove — the screen
     * already has an answer to show, and the fresh one replaces it in place.
     */
    const warm = readCache(key) !== undefined;
    if (!warm) setLoading(true);
    setError(null);

    Promise.resolve()
      .then(factory)
      .then((result) => {
        writeCache(key, result);
        if (!cancelled && mounted.current) setData(result);
      })
      .catch((err) => {
        /* A failed revalidation leaves what is on screen alone rather than
           blanking it — the cached answer is still the best one available, and
           replacing a list with an error because one refresh timed out is a
           worse screen than a list that is one round trip behind. */
        if (!cancelled && mounted.current && !warm) setError(err);
      })
      .finally(() => {
        if (!cancelled && mounted.current) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refetch, setData };
}
