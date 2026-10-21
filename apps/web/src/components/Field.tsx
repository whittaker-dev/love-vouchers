import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { duration, easeOut, spring } from "../lib/motion";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
}

/** Label + control + animated error. The render prop receives the id to put on the control. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(id)}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key="error"
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.fast, ease: easeOut }}
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p className={styles.hint}>{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[styles.control, className].filter(Boolean).join(" ")} {...props} />;
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** A password input with a show/hide toggle inside its right edge. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.password}>
      <Input type={visible ? "text" : "password"} className={[styles.passwordControl, className].filter(Boolean).join(" ")} {...props} />
      <motion.button
        type="button"
        className={styles.reveal}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.85 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={visible ? "shown" : "hidden"}
            aria-hidden
            initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, rotate: 30, opacity: 0 }}
            transition={spring.bouncy}
          >
            {visible ? "🙈" : "👀"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[styles.control, styles.textarea, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

/** Banner for request-level errors (as opposed to per-field ones). */
export function FormError({ message }: { message: string | null | undefined }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          className={styles.formError}
          role="alert"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: duration.fast, ease: easeOut }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
