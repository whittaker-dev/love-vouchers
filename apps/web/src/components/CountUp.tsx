import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { easeOut } from "../lib/motion";
import { formatNumber } from "../lib/format";

/** Number that counts up from 0 the first time it scrolls into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduceMotion) {
      node.textContent = formatNumber(value);
      return;
    }
    // Writes textContent directly: re-rendering React 60 times a second for a counter is waste.
    const controls = animate(0, value, {
      duration: 1.6,
      ease: easeOut,
      onUpdate: (latest) => {
        node.textContent = formatNumber(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
