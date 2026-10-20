import { motion, useScroll, useSpring } from "framer-motion";
import { createPortal } from "react-dom";
import styles from "./ScrollProgress.module.css";

/** Thin rose bar along the top edge that fills as the page is scrolled. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 });
  // Portalled: fixed elements inside the animated page wrapper would not stick to the screen.
  return createPortal(<motion.div className={styles.bar} style={{ scaleX }} aria-hidden />, document.body);
}
