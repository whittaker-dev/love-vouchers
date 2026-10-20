import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import styles from "./HeartBurst.module.css";

const HEART_COUNT = 14;

/** One-shot burst of hearts flying outward from the centre of its parent. */
export function HeartBurst() {
  const reduceMotion = useReducedMotion();
  // Fixed per mount so re-renders don't re-randomise mid-flight.
  const hearts = useMemo(
    () =>
      Array.from({ length: HEART_COUNT }, (_, index) => {
        const angle = (index / HEART_COUNT) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 70 + Math.random() * 60;
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 20,
          rotate: Math.random() * 60 - 30,
          scale: 0.6 + Math.random() * 0.7,
          delay: Math.random() * 0.12,
          glyph: index % 3 === 0 ? "💕" : "♥",
        };
      }),
    [],
  );

  if (reduceMotion) return null;

  return (
    <div className={styles.burst} aria-hidden>
      {hearts.map((heart, index) => (
        <motion.span
          key={index}
          className={styles.heart}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: heart.x, y: heart.y, scale: heart.scale, rotate: heart.rotate, opacity: 0 }}
          transition={{ duration: 1.1, delay: 0.1 + heart.delay, ease: [0.16, 1, 0.3, 1] }}
        >
          {heart.glyph}
        </motion.span>
      ))}
    </div>
  );
}
