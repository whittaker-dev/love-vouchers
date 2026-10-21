import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatDate, todayDateOnly } from "../lib/format";
import { duration, easeOut, spring } from "../lib/motion";
import { useMediaQuery } from "../lib/useMediaQuery";
import fieldStyles from "./Field.module.css";
import styles from "./DatePicker.module.css";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`);

type View = "days" | "months" | "years";

interface DatePickerProps {
  id?: string;
  /** "YYYY-MM-DD" or null. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Earliest selectable day, "YYYY-MM-DD". */
  min?: string;
  invalid?: boolean;
  /** Open on the year grid (birthdays, anniversaries) instead of the current month. */
  startView?: View;
}

const pad = (value: number) => String(value).padStart(2, "0");
const toDateOnly = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

function parse(value: string | null): { year: number; month: number } | null {
  if (!value) return null;
  const [year, month] = value.split("-").map(Number);
  return { year: year!, month: month! - 1 };
}

/**
 * Calendar date picker: a field-styled button that opens a popover (a bottom sheet on phones)
 * with day / month / year views. Months slide in the direction you navigate.
 */
export function DatePicker({ id, value, onChange, placeholder = "Chọn ngày", min, invalid, startView = "days" }: DatePickerProps) {
  const isPhone = useMediaQuery("(max-width: 640px)");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  const calendar = (
    <Calendar value={value} min={min} startView={value ? "days" : startView} onChoose={choose} />
  );

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <motion.button
        id={id}
        type="button"
        className={`${fieldStyles.control} ${styles.trigger}`}
        aria-invalid={invalid || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-empty={!value || undefined}
        onClick={() => setOpen((current) => !current)}
        whileTap={{ scale: 0.98 }}
      >
        <span>{value ? formatDate(value) : placeholder}</span>
        <motion.span className={styles.icon} animate={{ rotate: open ? -12 : 0, scale: open ? 1.15 : 1 }} transition={spring.bouncy} aria-hidden>
          📅
        </motion.span>
      </motion.button>

      {isPhone ? (
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="overlay"
                  className={styles.overlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  key="sheet"
                  ref={panelRef}
                  className={styles.sheet}
                  role="dialog"
                  aria-label="Chọn ngày"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={spring.soft}
                >
                  <span className={styles.grabber} aria-hidden />
                  {calendar}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              className={styles.popover}
              role="dialog"
              aria-label="Chọn ngày"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: duration.fast } }}
              transition={spring.snappy}
            >
              {calendar}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

interface CalendarProps {
  value: string | null;
  min?: string;
  startView: View;
  onChoose: (value: string | null) => void;
}

function Calendar({ value, min, startView, onChoose }: CalendarProps) {
  const today = todayDateOnly();
  const initial = parse(value) ?? parse(today)!;
  const [view, setView] = useState<View>(startView);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  // +1 when moving forward in time, -1 backwards: decides which way the grid slides.
  const [direction, setDirection] = useState(1);
  const selectedId = useId();

  function shiftMonth(step: number) {
    setDirection(step);
    const next = month + step;
    setYear(year + Math.floor(next / 12));
    setMonth(((next % 12) + 12) % 12);
  }

  const yearPageStart = Math.floor(year / 12) * 12;

  let title: string;
  let onPrev: () => void;
  let onNext: () => void;
  let onTitle: (() => void) | undefined;
  let gridKey: string;
  let grid: ReactNode;

  if (view === "days") {
    title = `Tháng ${month + 1}, ${year}`;
    onPrev = () => shiftMonth(-1);
    onNext = () => shiftMonth(1);
    onTitle = () => setView("months");
    gridKey = `d-${year}-${month}`;
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    grid = (
      <div className={styles.days}>
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className={styles.weekday}>
            {weekday}
          </span>
        ))}
        {Array.from({ length: leading }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = toDateOnly(year, month, day);
          const selected = date === value;
          const disabled = min !== undefined && date < min;
          return (
            <motion.button
              key={date}
              type="button"
              className={styles.day}
              data-today={date === today || undefined}
              data-selected={selected || undefined}
              disabled={disabled}
              onClick={() => onChoose(date)}
              whileHover={disabled ? undefined : { scale: 1.12 }}
              whileTap={disabled ? undefined : { scale: 0.9 }}
              transition={spring.snappy}
              aria-label={formatDate(date)}
              aria-pressed={selected}
            >
              {selected && <motion.span layoutId={selectedId} className={styles.selected} transition={spring.bouncy} />}
              <span className={styles.dayNumber}>{day}</span>
            </motion.button>
          );
        })}
      </div>
    );
  } else if (view === "months") {
    title = String(year);
    onPrev = () => {
      setDirection(-1);
      setYear(year - 1);
    };
    onNext = () => {
      setDirection(1);
      setYear(year + 1);
    };
    onTitle = () => setView("years");
    gridKey = `m-${year}`;
    grid = (
      <div className={styles.cells}>
        {MONTHS.map((label, index) => (
          <motion.button
            key={label}
            type="button"
            className={styles.cell}
            data-selected={(index === month && parse(value)?.year === year) || undefined}
            onClick={() => {
              setMonth(index);
              setView("days");
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {label}
          </motion.button>
        ))}
      </div>
    );
  } else {
    title = `${yearPageStart} – ${yearPageStart + 11}`;
    onPrev = () => {
      setDirection(-1);
      setYear(year - 12);
    };
    onNext = () => {
      setDirection(1);
      setYear(year + 12);
    };
    gridKey = `y-${yearPageStart}`;
    grid = (
      <div className={styles.cells}>
        {Array.from({ length: 12 }, (_, index) => yearPageStart + index).map((candidate) => (
          <motion.button
            key={candidate}
            type="button"
            className={styles.cell}
            data-selected={candidate === parse(value)?.year || undefined}
            data-today={candidate === Number(today.slice(0, 4)) || undefined}
            onClick={() => {
              setYear(candidate);
              setView("months");
            }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            {candidate}
          </motion.button>
        ))}
      </div>
    );
  }

  const canPickToday = min === undefined || today >= min;

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <motion.button type="button" className={styles.nav} onClick={onPrev} whileTap={{ scale: 0.85, x: -2 }} aria-label="Trước">
          ‹
        </motion.button>
        <motion.button
          type="button"
          className={styles.title}
          onClick={onTitle}
          disabled={!onTitle}
          whileHover={onTitle ? { scale: 1.04 } : undefined}
          whileTap={onTitle ? { scale: 0.96 } : undefined}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={title}
              initial={{ y: 10 * direction, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10 * direction, opacity: 0 }}
              transition={{ duration: duration.fast }}
            >
              {title}
            </motion.span>
          </AnimatePresence>
          {onTitle && <span className={styles.caret}>▾</span>}
        </motion.button>
        <motion.button type="button" className={styles.nav} onClick={onNext} whileTap={{ scale: 0.85, x: 2 }} aria-label="Sau">
          ›
        </motion.button>
      </div>

      <div className={styles.viewport}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={gridKey}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: duration.base, ease: easeOut }}
          >
            {grid}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.footerButton} onClick={() => onChoose(null)}>
          Xoá
        </button>
        <button type="button" className={styles.footerButton} onClick={() => onChoose(today)} disabled={!canPickToday}>
          Hôm nay
        </button>
      </div>
    </div>
  );
}
