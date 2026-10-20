import type { Transition, Variants } from "framer-motion";

// Motion tokens. Every animation in the app pulls from here so the whole site moves the same
// way; see "Chuyển động" in design.md before adding a new curve or duration.

/** Fast start, long gentle settle — the house curve for anything entering the screen. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.2,
  base: 0.45,
  slow: 0.8,
} as const;

/** Interactive elements (hover, press, layout morphs): springs feel physical and never overshoot much. */
export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32 } satisfies Transition,
  soft: { type: "spring", stiffness: 220, damping: 28 } satisfies Transition,
  bouncy: { type: "spring", stiffness: 380, damping: 16 } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easeOut } },
};

export const staggerChildren = (stagger = 0.06, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/**
 * Page enter/exit. Because it animates `filter`, the page wrapper becomes the containing block for
 * any `position: fixed` descendant (even at blur(0px)). Floating UI must portal to document.body.
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12, filter: "blur(6px)" },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.base, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: duration.fast, ease: "easeIn" },
  },
};
