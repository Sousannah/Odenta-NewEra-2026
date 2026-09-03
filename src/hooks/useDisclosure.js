import { useCallback, useState } from "react";

/** open/close state plus the payload a modal or drawer was opened with. */
export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  const [payload, setPayload] = useState(null);

  const open = useCallback((value = null) => {
    setPayload(value);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, payload, open, close, toggle, setPayload };
}
