import { motion } from "framer-motion";
import { useId } from "react";
import { spring } from "../lib/motion";
import styles from "./DayMonthPicker.module.css";

interface DayMonthPickerProps {
  day: number | null;
  month: number | null;
  onChange: (value: { day: number | null; month: number | null }) => void;
  /** Lunar months have at most 30 days; solar ones follow the month (29/2 allowed: it recurs on leap years). */
  calendar: "solar" | "lunar";
}

const SOLAR_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * A recurring yearly date (no year): month chips on top, day grid below. The selection pill
 * glides between choices.
 */
export function DayMonthPicker({ day, month, onChange, calendar }: DayMonthPickerProps) {
  const monthPill = useId();
  const dayPill = useId();
  const daysInMonth = month ? (calendar === "lunar" ? 30 : SOLAR_DAYS[month - 1]!) : 31;

  function pickMonth(next: number) {
    const max = calendar === "lunar" ? 30 : SOLAR_DAYS[next - 1]!;
    // Keep the chosen day when it still exists in the new month.
    onChange({ month: next, day: day && day <= max ? day : null });
  }

  return (
    <div className={styles.picker}>
      <div className={styles.months} role="radiogroup" aria-label="Tháng">
        {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
          <motion.button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === month}
            className={styles.month}
            onClick={() => pickMonth(value)}
            whileTap={{ scale: 0.92 }}
          >
            {value === month && <motion.span layoutId={monthPill} className={styles.pill} transition={spring.snappy} />}
            <span className={styles.label}>Th {value}</span>
          </motion.button>
        ))}
      </div>
      <motion.div className={styles.days} role="radiogroup" aria-label="Ngày" layout>
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((value) => (
          <motion.button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === day}
            className={styles.day}
            onClick={() => onChange({ month, day: value })}
            disabled={!month}
            whileHover={month ? { scale: 1.12 } : undefined}
            whileTap={month ? { scale: 0.9 } : undefined}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring.snappy, delay: (value - 1) * 0.006 }}
          >
            {value === day && <motion.span layoutId={dayPill} className={styles.pill} transition={spring.bouncy} />}
            <span className={styles.label}>{value}</span>
          </motion.button>
        ))}
      </motion.div>
      <p className={styles.hint}>
        {month
          ? day
            ? `Ngày ${day} tháng ${month}${calendar === "lunar" ? " âm lịch" : ""} hằng năm`
            : "Chọn ngày"
          : "Chọn tháng trước"}
      </p>
    </div>
  );
}
