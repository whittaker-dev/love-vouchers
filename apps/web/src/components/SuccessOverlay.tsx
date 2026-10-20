import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { duration, easeOut, spring } from "../lib/motion";
import { Button } from "./Button";
import { HeartBurst } from "./HeartBurst";
import styles from "./SuccessOverlay.module.css";

interface SuccessOverlayProps {
  open: boolean;
  count: number;
  onClose: () => void;
}

const copyItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOut } },
};

/** Celebration shown after a wish is sent: envelope drop, heart burst, then the copy staggers in. */
export function SuccessOverlay({ open, count, onClose }: SuccessOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.1 } }}
          transition={{ duration: duration.base }}
        >
          <motion.div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.7, y: 60, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={spring.bouncy}
          >
            <div className={styles.illustration}>
              <HeartBurst />
              <motion.span
                className={styles.envelope}
                initial={{ y: -80, rotate: -25, scale: 0.5 }}
                animate={{ y: [-80, 0, -10, 0], rotate: [-25, 8, -4, 0], scale: [0.5, 1.1, 1] }}
                transition={{ duration: 0.8, ease: easeOut }}
              >
                💌
              </motion.span>
            </div>
            <motion.div
              className={styles.copy}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } }}
            >
              <motion.p className="eyebrow" variants={copyItem}>
                Đã gửi {count} điều ước
              </motion.p>
              <motion.h2 id="success-title" className={styles.title} variants={copyItem}>
                Ôi, em đáng yêu quá đi!
              </motion.h2>
              <motion.p className={styles.body} variants={copyItem}>
                Điều ước của em đang bay tới chỗ anh rồi. Chuẩn bị nhận thêm thật nhiều yêu thương nha ♡
              </motion.p>
              <motion.p className={styles.hearts} variants={copyItem} aria-hidden>
                {["♥", "♡", "♥"].map((heart, index) => (
                  <motion.span
                    key={index}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {heart}
                  </motion.span>
                ))}
              </motion.p>
              <motion.div className={styles.action} variants={copyItem}>
                <Button onClick={onClose} block>
                  Ước thêm điều nữa ✨
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
