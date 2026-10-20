import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useMemo } from "react";
import styles from "./IntroLoader.module.css";

const HEART_PATH =
  "M50 86 C50 86 12 62 12 36 C12 22 23 12 35 12 C42 12 47 16 50 21 C53 16 58 12 65 12 C77 12 88 22 88 36 C88 62 50 86 50 86 Z";
const WORDMARK = "love vouchers";

/** Spread of the tile wave: the farthest tile starts this long after the centre one. */
const TILE_WAVE_SECONDS = 0.4;
const TILE_JITTER_SECONDS = 0.12;
const TILE_DURATION_SECONDS = 0.35;

interface Tile {
  key: string;
  delay: number;
}

/** Enough tiles to cover the viewport, each delayed by its distance from the centre plus a little noise. */
function buildTiles(): { columns: number; tiles: Tile[] } {
  const size = window.innerWidth < 640 ? 56 : 80;
  const columns = Math.ceil(window.innerWidth / size);
  const rows = Math.ceil(window.innerHeight / size);
  const centerX = (columns - 1) / 2;
  const centerY = (rows - 1) / 2;
  const maxDistance = Math.hypot(centerX, centerY) || 1;
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const distance = Math.hypot(column - centerX, row - centerY) / maxDistance;
      tiles.push({
        key: `${row}-${column}`,
        delay: distance * TILE_WAVE_SECONDS + Math.random() * TILE_JITTER_SECONDS,
      });
    }
  }
  return { columns, tiles };
}

// The root only orchestrates: on exit it waits for every child (content, then tiles) to finish.
const rootVariants: Variants = {
  shown: {},
  hidden: { transition: { when: "afterChildren" } },
};

const tileVariants: Variants = {
  shown: { scale: 1, rotate: 0, borderRadius: "0%", opacity: 1 },
  hidden: (delay: number) => ({
    scale: 0,
    rotate: 45,
    borderRadius: "40%",
    opacity: 0,
    transition: { delay: 0.15 + delay, duration: TILE_DURATION_SECONDS, ease: [0.65, 0, 0.35, 1] },
  }),
};

const contentVariants: Variants = {
  shown: { scale: 1, opacity: 1 },
  hidden: { scale: 0.6, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

/**
 * Opening sequence (~2s), in three beats:
 *   1. the heart outline draws itself while the wordmark types in,
 *   2. it fills rose and beats,
 *   3. (exit, driven by the parent's AnimatePresence) the screen breaks into a grid of tiles that
 *      switch off one by one, rippling out from the centre, revealing the page through the gaps.
 */
export function IntroLoader() {
  const { columns, tiles } = useMemo(buildTiles, []);

  return (
    <motion.div className={styles.screen} variants={rootVariants} initial="shown" animate="shown" exit="hidden" aria-hidden>
      <div className={styles.tiles} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {tiles.map((tile) => (
          <motion.span key={tile.key} className={styles.tile} variants={tileVariants} custom={tile.delay} />
        ))}
      </div>

      <motion.div className={styles.content} variants={contentVariants}>
        <motion.svg
          className={styles.heart}
          viewBox="0 0 100 100"
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1, 1, 1.14, 1, 1.1, 1] }}
          transition={{ duration: 1.3, times: [0, 0.3, 0.55, 0.65, 0.75, 0.85, 1], ease: "easeOut" }}
        >
          <motion.path
            d={HEART_PATH}
            fill="var(--color-accent)"
            stroke="var(--color-heading)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            transition={{
              pathLength: { duration: 0.7, ease: [0.65, 0, 0.35, 1] },
              fillOpacity: { delay: 0.65, duration: 0.3 },
            }}
          />
        </motion.svg>

        <p className={styles.wordmark}>
          {WORDMARK.split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.2 + index * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {letter === " " ? " " : letter}
            </motion.span>
          ))}
        </p>

        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className={styles.sparkle}
            style={{ left: `${[18, 78, 64][index]}%`, top: `${[24, 30, 74][index]}%` }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8], rotate: [0, 90] }}
            transition={{ delay: 0.5 + index * 0.12, duration: 0.6 }}
          >
            ✦
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
