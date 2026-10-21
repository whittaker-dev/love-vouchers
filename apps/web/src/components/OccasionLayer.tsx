import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ActiveOccasionDto, OccasionTheme } from "@love/shared";
import { useActiveOccasion } from "../api/hooks";
import { spring } from "../lib/motion";
import { OCCASION_THEME_STYLES } from "../lib/occasionThemes";
import { useMediaQuery } from "../lib/useMediaQuery";
import styles from "./OccasionLayer.module.css";

/** The admin's "Xem thử" opens her page with ?preview=<occasionId>. */
function previewIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("preview");
}

const dismissKey = (occasion: ActiveOccasionDto) => `lv-occasion-dismissed:${occasion.id}:${occasion.date}`;

function readDismissed(occasion: ActiveOccasionDto): boolean {
  try {
    return localStorage.getItem(dismissKey(occasion)) === "1";
  } catch {
    return false;
  }
}

/**
 * Themed look for the current occasion: drifting emoji over the whole page plus a greeting
 * banner under the top bar. Renders nothing on ordinary days.
 */
export function OccasionLayer({ play }: { play: boolean }) {
  const [previewId] = useState(previewIdFromUrl);
  const occasion = useActiveOccasion(previewId).data ?? null;
  if (!occasion) return null;
  return (
    <>
      {play && <Particles theme={occasion.theme} />}
      <Banner key={`${occasion.id}:${occasion.date}`} occasion={occasion} play={play} preview={previewId !== null} />
    </>
  );
}

function Banner({ occasion, play, preview }: { occasion: ActiveOccasionDto; play: boolean; preview: boolean }) {
  // Closing hides it for the rest of that occasion; a preview always shows it.
  const [dismissed, setDismissed] = useState(() => !preview && readDismissed(occasion));

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey(occasion), "1");
    } catch {
      // Private mode: it just comes back on the next visit.
    }
  }

  return (
    <AnimatePresence>
      {play && !dismissed && (
        <motion.div
          className={`container ${styles.bannerWrap}`}
          initial={{ opacity: 0, y: -24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.2 } }}
          transition={{ ...spring.bouncy, delay: 0.4 }}
        >
          <div className={styles.banner} data-theme={occasion.theme} role="status">
            <motion.span
              className={styles.bannerEmoji}
              animate={{ rotate: [0, -14, 12, -6, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2 }}
              aria-hidden
            >
              {occasion.emoji}
            </motion.span>
            <div className={styles.bannerText}>
              <span className={styles.bannerName}>
                {occasion.name}
                {preview && " · xem thử"}
              </span>
              <span>{occasion.message}</span>
            </div>
            <motion.button
              type="button"
              className={styles.close}
              onClick={dismiss}
              aria-label="Ẩn lời chúc"
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.85 }}
            >
              ✕
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Emoji drifting over the page. CSS keyframes: a constant loop costs no JavaScript per frame. */
function Particles({ theme }: { theme: OccasionTheme }) {
  const isPhone = useMediaQuery("(max-width: 640px)");
  const { particles, motion: movement } = OCCASION_THEME_STYLES[theme];
  const count = isPhone ? 12 : 22;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        glyph: particles[index % particles.length]!,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${14 + Math.random() * 18}px`,
          animationDuration: `${(movement === "twinkle" || movement === "burst" ? 2.5 : 9) + Math.random() * 7}s`,
          // Negative delay: the screen starts already populated instead of empty.
          animationDelay: `${-Math.random() * 12}s`,
          "--sway": `${(Math.random() - 0.5) * 120}px`,
        } as CSSProperties,
      })),
    [count, particles, movement],
  );

  return createPortal(
    <div className={styles.particles} data-motion={movement} aria-hidden>
      {items.map((item, index) => (
        <span key={index} className={styles.particle} style={item.style}>
          {item.glyph}
        </span>
      ))}
    </div>,
    document.body,
  );
}
