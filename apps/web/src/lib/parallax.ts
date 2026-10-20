import { useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

/**
 * Maps a 0→1 scroll progress to a vertical offset of `distance` px, smoothed with a spring so the
 * layer trails the scroll slightly instead of moving rigidly with it.
 *
 * Scroll-linked values bypass MotionConfig's reducedMotion setting, so it is checked here.
 */
export function useParallax(progress: MotionValue<number>, distance: number): MotionValue<number> {
  const reduceMotion = useReducedMotion();
  const raw = useTransform(progress, [0, 1], [0, reduceMotion ? 0 : distance]);
  return useSpring(raw, { stiffness: 140, damping: 30, mass: 0.4 });
}
