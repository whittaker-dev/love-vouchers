import { AnimatePresence, motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { spring } from "../lib/motion";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

/** Button look for a router <Link>, so navigation stays a real link instead of a button-in-anchor. */
export function buttonClassName(variant: Variant = "primary", size: Size = "md"): string {
  return [styles.button, styles[variant], styles[size]].join(" ");
}

/**
 * Pill button that sits on a flat offset shadow and physically "presses" into it:
 * lifts on hover, sinks on tap, and swaps its label for a spinner while loading.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type={type}
      className={[styles.button, styles[variant], styles[size], block && styles.block, className]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={isDisabled ? undefined : { y: -2 }}
      whileTap={isDisabled ? undefined : { y: 3, scale: 0.985 }}
      transition={spring.snappy}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={loading ? "loading" : "label"}
          className={styles.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {loading ? <span className={styles.spinner} aria-label="Đang xử lý" /> : (children as React.ReactNode)}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
