import { motion } from "framer-motion";
import { spring } from "../lib/motion";
import styles from "./Switch.module.css";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.switch}
      data-on={checked || undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <motion.span className={styles.thumb} layout transition={spring.snappy} />
    </button>
  );
}
