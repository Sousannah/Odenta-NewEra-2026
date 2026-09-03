import { useCallback, useEffect, useRef, useState } from "react";

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
export function useAsync(factory, deps = [], initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(factory)
      .then((result) => {
        if (!cancelled && mounted.current) setData(result);
      })
      .catch((err) => {
        if (!cancelled && mounted.current) setError(err);
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
