import { motion } from "framer-motion";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { duration, easeOut } from "../lib/motion";
import styles from "./RevealText.module.css";

interface RevealTextProps {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  delay?: number;
  /** Hold the animation until true (e.g. until the intro loader has lifted). */
  play?: boolean;
  /** Rendered after the last word, revealed with it (an emoji, a sticker). */
  trailing?: ReactNode;
}

/**
 * Headline reveal: each word slides up from behind a mask, one after another.
 * The mask has vertical padding so Vietnamese stacked diacritics (ễ, ợ, ặ) are not clipped.
 */
export function RevealText({ text, as = "h1", className, delay = 0, play = true, trailing }: RevealTextProps) {
  const Tag = motion[as];
  const words = text.split(" ");
  const wordVariants = {
    hidden: { y: "115%", rotate: 6 },
    visible: { y: "0%", rotate: 0, transition: { duration: duration.slow, ease: easeOut } },
  };
  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      animate={play ? "visible" : "hidden"}
      variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
    >
      {words.map((word, index) => (
        // The space must sit outside the inline-block mask, where it would collapse to nothing.
        <Fragment key={index}>
          <span className={styles.mask} aria-hidden>
            <motion.span className={styles.word} variants={wordVariants}>
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 && " "}
        </Fragment>
      ))}
      {trailing && (
        <>
          {" "}
          <span className={styles.mask} aria-hidden>
            <motion.span className={styles.word} variants={wordVariants}>
              {trailing}
            </motion.span>
          </span>
        </>
      )}
    </Tag>
  );
}
