import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Scroll-reveal wrapper.
 *
 * IntersectionObserver plus two CSS classes — no animation library. The
 * observer disconnects after the first intersection, so a long page does not
 * keep dozens of observers alive.
 */
export function Reveal({ as: Tag = "div", delay = 0, className, children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("od-reveal", visible && "od-reveal-visible", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
