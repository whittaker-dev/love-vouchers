import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useOutlet } from "react-router";
import { pageTransition } from "../lib/motion";

/**
 * Router outlet with page transitions. `useOutlet` snapshots the current element so the
 * leaving page keeps rendering its own content while it animates out.
 */
export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
