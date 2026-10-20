import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { spring } from "../lib/motion";
import styles from "./SelectionBar.module.css";

interface SelectionBarProps {
  count: number;
  visible: boolean;
  onClick: () => void;
}

/**
 * Floating pill that follows her down the page once something is picked, jumping to the wish form.
 * Portalled to <body>: inside the animated page wrapper `position: fixed` would not stick to the screen.
 */
export function SelectionBar({ count, visible, onClick }: SelectionBarProps) {
  return createPortal(
    <AnimatePresence>
      {visible && count > 0 && (
        <motion.button
          type="button"
          className={styles.bar}
          onClick={onClick}
          initial={{ y: 120, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 120, x: "-50%", opacity: 0 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={spring.snappy}
        >
          <span className={styles.count}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={spring.snappy}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </span>
          đã chọn · Gửi điều ước ♡
        </motion.button>
      )}
    </AnimatePresence>,
    document.body,
  );
}
