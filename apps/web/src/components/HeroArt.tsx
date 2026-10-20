import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent } from "react";
import { spring } from "../lib/motion";
import styles from "./HeroArt.module.css";

interface HeroArtProps {
  /** Her avatar emoji, shown big inside the blob. */
  avatarEmoji: string;
  play: boolean;
}

/**
 * The hero illustration: a pink disc, a slowly morphing outlined blob with her avatar emoji,
 * a tilted "của anh" note and sparkles. The layers drift apart with the cursor for depth.
 */
export function HeroArt({ avatarEmoji, play }: HeroArtProps) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 120, damping: 20 });
  const y = useSpring(pointerY, { stiffness: 120, damping: 20 });
  const blobX = useTransform(x, (value) => value * 14);
  const blobY = useTransform(y, (value) => value * 14);
  const noteX = useTransform(x, (value) => value * -22);
  const noteY = useTransform(y, (value) => value * -22);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <motion.div
      className={styles.art}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
      animate={play ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
      transition={{ ...spring.soft, delay: 0.25 }}
      aria-hidden
    >
      <div className={styles.disc} />
      <motion.div className={styles.blobWrap} style={{ x: blobX, y: blobY }}>
        <div className={styles.blob}>
          <motion.span
            className={styles.bigEmoji}
            animate={{ scale: [1, 1.08, 1, 1.05, 1], rotate: [0, -4, 0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.8 }}
          >
            {avatarEmoji}
          </motion.span>
        </div>
      </motion.div>
      <motion.div
        className={styles.note}
        style={{ x: noteX, y: noteY }}
        whileHover={{ rotate: 0, scale: 1.08 }}
        transition={spring.bouncy}
      >
        của anh
        <br />
        mãi mãi ♡
      </motion.div>
      {[
        { left: "14%", top: "30%", delay: 0 },
        { left: "70%", top: "76%", delay: 0.6 },
        { left: "82%", top: "12%", delay: 1.2 },
      ].map((sparkle, index) => (
        <motion.span
          key={index}
          className={styles.sparkle}
          style={{ left: sparkle.left, top: sparkle.top }}
          animate={{ scale: [0.7, 1.15, 0.7], rotate: [0, 45, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: sparkle.delay, ease: "easeInOut" }}
        >
          ✦
        </motion.span>
      ))}
    </motion.div>
  );
}
