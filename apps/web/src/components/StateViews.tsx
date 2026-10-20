import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { duration, easeOut } from "../lib/motion";
import styles from "./StateViews.module.css";

/** Shimmering placeholder blocks shaped like the content that is loading. */
export function Skeleton({ height, radius = 20 }: { height: number; radius?: number }) {
  return <div className={styles.skeleton} style={{ height, borderRadius: radius }} aria-hidden />;
}

export function LoadingText({ children = "Đang tải…" }: { children?: ReactNode }) {
  return (
    <p className={styles.loading} role="status">
      {children}
    </p>
  );
}

interface MessageProps {
  emoji: string;
  title: string;
  children?: ReactNode;
}

export function EmptyState({ emoji, title, children }: MessageProps) {
  return (
    <motion.div
      className={styles.message}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeOut }}
    >
      <span className={styles.emoji}>{emoji}</span>
      <h3>{title}</h3>
      {children && <div className={styles.body}>{children}</div>}
    </motion.div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <EmptyState emoji="🥲" title="Có chút trục trặc">
      <p>{error.message}</p>
    </EmptyState>
  );
}
