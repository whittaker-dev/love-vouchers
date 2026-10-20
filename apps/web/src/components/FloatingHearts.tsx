import { motion, useScroll } from "framer-motion";
import type { RefObject } from "react";
import { useParallax } from "../lib/parallax";
import styles from "./FloatingHearts.module.css";

// Hand-placed so they sit in the margins around the grid rather than behind card text.
const HEARTS = [
  { left: "-3%", top: "6%", size: 34, speed: -220, glyph: "♥" },
  { left: "97%", top: "14%", size: 22, speed: -360, glyph: "♡" },
  { left: "-1%", top: "48%", size: 18, speed: -420, glyph: "✦" },
  { left: "99%", top: "56%", size: 40, speed: -180, glyph: "♥" },
  { left: "2%", top: "88%", size: 26, speed: -300, glyph: "♡" },
  { left: "95%", top: "92%", size: 16, speed: -460, glyph: "✦" },
];

/** Decorative hearts behind a section, each drifting at its own speed as the section scrolls past. */
export function FloatingHearts({ target }: { target: RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  return (
    <div className={styles.layer} aria-hidden>
      {HEARTS.map((heart, index) => (
        <Heart key={index} heart={heart} progress={scrollYProgress} />
      ))}
    </div>
  );
}

function Heart({
  heart,
  progress,
}: {
  heart: (typeof HEARTS)[number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const y = useParallax(progress, heart.speed);
  return (
    <motion.span
      className={styles.heart}
      style={{ left: heart.left, top: heart.top, fontSize: heart.size, y }}
      animate={{ rotate: [-8, 8, -8] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {heart.glyph}
    </motion.span>
  );
}
