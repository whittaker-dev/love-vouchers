import { AnimatePresence, motion } from "framer-motion";
import { spring } from "../lib/motion";
import { Input } from "./Field";
import styles from "./EmojiPicker.module.css";

interface EmojiPickerProps {
  label: string;
  value: string;
  onChange: (emoji: string) => void;
  presets: readonly string[];
  error?: string;
}

/** Big preview + free-text field (any emoji from the keyboard) + a row of one-tap presets. */
export function EmojiPicker({ label, value, onChange, presets, error }: EmojiPickerProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <div className={styles.preview} aria-hidden>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={value}
              initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.3, rotate: 30, opacity: 0 }}
              transition={spring.bouncy}
            >
              {value || "?"}
            </motion.span>
          </AnimatePresence>
        </div>
        <Input
          aria-label={label}
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
        <div className={styles.presets}>
          {presets.map((emoji) => (
            <motion.button
              key={emoji}
              type="button"
              className={styles.preset}
              data-selected={value === emoji || undefined}
              onClick={() => onChange(emoji)}
              aria-label={`Chọn ${emoji}`}
              whileHover={{ scale: 1.2, rotate: -8 }}
              whileTap={{ scale: 0.85 }}
              transition={spring.snappy}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
